-- ADHOC | iO_Message_Notify XML extract | R Konda | 2026-10-14 | Decode the token-escaped XML in MNF_Message and surface it as readable columns
-- Change log:
--   2026-10-14 RK  initial version
--   2026-10-14 RK  fix Msg 537 (LEFT/SUBSTRING length) in the pDataString split, fix Msg 4148 (XML method in GROUP BY)
--                  in the summary, add @SearchText to locate messages raised by ioSRVLetter.exe
--
-- MNF_Message is stored as TEXT with the XML escaped as ;lt; ;gt; ;apos; ;quot; ;amp; and ;nl; (newline).
-- Steps: cast TEXT -> NVARCHAR(MAX), un-escape tokens, strip the <?xml ... ?> declaration
-- (CAST to XML fails with error 9402 if an encoding declaration is present), then shred with XQuery.
-- CORE is compat 110: no STRING_SPLIT / OPENJSON, so the DataShare pDataString is split with a tally.
--
-- Why the two errors happened and how they are fixed:
--   Msg 537  - SQL Server does not guarantee that WHERE CHARINDEX('[|]', Pair) > 0 is evaluated before the
--              LEFT(Pair, CHARINDEX(...) - 1) in the SELECT, so a pair with no '[|]' produced LEFT(..., -1).
--              The separator position is now computed once (NULLIF(..., 0)) and every LEFT/SUBSTRING is NULL-safe.
--   Msg 4148 - XML .value() is not allowed directly in GROUP BY. The values are shredded in a derived table
--              first and the outer query groups on the plain NVARCHAR columns.

SET NOCOUNT ON;

DECLARE @FromDate   DATETIME         = '2026-09-01',
        @ToDate     DATETIME         = '2026-10-31',
        @ServiceID  UNIQUEIDENTIFIER = NULL,              -- optional: filter on MNF_IDLink_CMR (QService ID)
        @SearchText NVARCHAR(200)    = N'ioSRVLetter';    -- optional: substring to find anywhere in the title or
                                                          -- decoded message (service name, ErrorMessage, DataShare).
                                                          -- 'ioSRVLetter' also matches 'ioSRVLetter.exe'. NULL = no filter.

IF OBJECT_ID('tempdb..#Msg') IS NOT NULL DROP TABLE #Msg;

-- 1. Un-escape the message text
SELECT  m.MNF_ID,
        m.MNF_SeqNumber,
        m.MNF_Type,
        m.MNF_Date,
        m.MNF_IDLink_CMR            AS ServiceID,
        m.MNF_Title,
        Decoded = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                      CAST(m.MNF_Message AS NVARCHAR(MAX)),
                      ';nl;',   CHAR(13) + CHAR(10)),
                      ';lt;',   '<'),
                      ';gt;',   '>'),
                      ';apos;', ''''),
                      ';quot;', '"'),
                      ';amp;',  '&amp;')          -- keep & entity-safe for the XML parser
INTO    #Msg
FROM    dbo.iO_Message_Notify m
WHERE   m.MNF_Date >= @FromDate
AND     m.MNF_Date <  DATEADD(DAY, 1, @ToDate)
AND     (@ServiceID IS NULL OR m.MNF_IDLink_CMR = @ServiceID)
AND     m.MNF_Message IS NOT NULL
AND     (   @SearchText IS NULL
         OR m.MNF_Title LIKE N'%' + @SearchText + N'%'
         OR CAST(m.MNF_Message AS NVARCHAR(MAX)) LIKE N'%' + @SearchText + N'%');

CREATE CLUSTERED INDEX IX_Msg ON #Msg (MNF_SeqNumber);

-- 2. Strip the XML declaration and convert to typed XML
IF OBJECT_ID('tempdb..#Xml') IS NOT NULL DROP TABLE #Xml;

SELECT  MNF_ID, MNF_SeqNumber, MNF_Type, MNF_Date, ServiceID, MNF_Title, Decoded,
        MsgXml = TRY_CAST(
                    CASE WHEN CHARINDEX('?>', Decoded) > 0
                         THEN SUBSTRING(Decoded, CHARINDEX('?>', Decoded) + 2, LEN(Decoded))
                         ELSE Decoded
                    END AS XML)
INTO    #Xml
FROM    #Msg;

-- 3. Readable result: one row per message with the key XML nodes as columns
SELECT  x.MNF_SeqNumber,
        x.MNF_Date,
        x.ServiceID,
        x.MNF_Title,
        MsgDate      = LTRIM(RTRIM(REPLACE(REPLACE(x.MsgXml.value('(/Message/Date/text())[1]',    'NVARCHAR(50)'),  CHAR(13), ''), CHAR(10), ''))),
        MsgService   = LTRIM(RTRIM(REPLACE(REPLACE(x.MsgXml.value('(/Message/Service/text())[1]', 'NVARCHAR(50)'),  CHAR(13), ''), CHAR(10), ''))),
        MsgTitle     = LTRIM(RTRIM(REPLACE(REPLACE(x.MsgXml.value('(/Message/Title/text())[1]',   'NVARCHAR(200)'), CHAR(13), ''), CHAR(10), ''))),
        -- NodeError style (iOWorkFlowExecute)
        ErrorTitle   = x.MsgXml.value('(/Message/Content/NodeError/ErrorTitle/text())[1]',   'NVARCHAR(200)'),
        ErrorMessage = x.MsgXml.value('(/Message/Content/NodeError/ErrorMessage/text())[1]', 'NVARCHAR(MAX)'),
        -- Free-text Content style (Transaction Processing)
        ContentText  = LTRIM(RTRIM(x.MsgXml.value('(/Message/Content/text())[1]', 'NVARCHAR(MAX)'))),
        -- DataShare block (present on transaction-processing errors)
        AccountID            = x.MsgXml.value('(/Message/Data/DataShare/pAccountID/text())[1]',            'UNIQUEIDENTIFIER'),
        AccountTransactionID = x.MsgXml.value('(/Message/Data/DataShare/pAccountTransactionID/text())[1]', 'UNIQUEIDENTIFIER'),
        TransactionType      = x.MsgXml.value('(/Message/Data/DataShare/pTransactionType/text())[1]',      'UNIQUEIDENTIFIER'),
        TaskID               = x.MsgXml.value('(/Message/Data/DataShare/pTaskID/text())[1]',               'UNIQUEIDENTIFIER'),
        BatchID              = x.MsgXml.value('(/Message/Data/DataShare/pBatchID/text())[1]',              'UNIQUEIDENTIFIER'),
        EODActive            = x.MsgXml.value('(/Message/Data/DataShare/pEODActive/text())[1]',            'NVARCHAR(10)'),
        DataString           = x.MsgXml.value('(/Message/Data/DataShare/pDataString/text())[1]',           'NVARCHAR(MAX)'),
        -- Where in the message the search text was found (helps when hunting a specific exe / service)
        SearchHit    = CASE WHEN @SearchText IS NULL                                  THEN NULL
                            WHEN x.MNF_Title LIKE N'%' + @SearchText + N'%'           THEN 'Title'
                            WHEN x.Decoded   LIKE N'%' + @SearchText + N'%'           THEN 'Message'
                       END,
        -- Full decoded XML: click the cell in SSMS to open it formatted
        x.MsgXml,
        -- Rows where the XML would not parse (TRY_CAST returned NULL) still show the raw decoded text
        RawDecoded   = CASE WHEN x.MsgXml IS NULL THEN x.Decoded END
FROM    #Xml x
ORDER BY x.MNF_Date DESC, x.MNF_SeqNumber DESC;

-- 4. Optional: split pDataString ("key[|]value[^]key[|]value[^]...") into one row per key/value
--    Tally-based because compat 110 has no STRING_SPLIT.
IF OBJECT_ID('tempdb..#DataStr') IS NOT NULL DROP TABLE #DataStr;

SELECT  x.MNF_SeqNumber, x.MNF_Date,
        DataString = x.MsgXml.value('(/Message/Data/DataShare/pDataString/text())[1]', 'NVARCHAR(MAX)')
INTO    #DataStr
FROM    #Xml x
WHERE   x.MsgXml.exist('/Message/Data/DataShare/pDataString') = 1;

DECLARE @MaxLen INT = ISNULL((SELECT MAX(LEN(DataString)) FROM #DataStr), 0);

-- Cascading-CTE tally sized to the longest pDataString (the original TOP 8000 silently truncated longer strings)
;WITH E1 AS (SELECT n = 1 FROM (VALUES (1),(1),(1),(1),(1),(1),(1),(1),(1),(1)) v(n)),   -- 10
      E2 AS (SELECT n = 1 FROM E1 a CROSS JOIN E1 b),                                   -- 100
      E4 AS (SELECT n = 1 FROM E2 a CROSS JOIN E2 b),                                   -- 10,000
      E8 AS (SELECT n = 1 FROM E4 a CROSS JOIN E4 b),                                   -- 100,000,000
Tally AS (
        SELECT TOP (@MaxLen) n = ROW_NUMBER() OVER (ORDER BY (SELECT NULL))
        FROM   E8
),
Pairs AS (
        -- t.n is the 1-based start of each pair: position 1, and every position following a '[^]'
        SELECT  s.MNF_SeqNumber, s.MNF_Date,
                Pair = SUBSTRING(s.DataString, t.n,
                                 CHARINDEX('[^]', s.DataString + '[^]', t.n) - t.n)
        FROM    #DataStr s
        JOIN    Tally t
          ON    t.n <= LEN(s.DataString)
         AND    (t.n = 1 OR SUBSTRING(s.DataString, t.n - 3, 3) = '[^]')
),
Split AS (
        -- Compute the separator position once; NULLIF makes every LEFT/SUBSTRING below NULL-safe (fixes Msg 537)
        SELECT  p.MNF_SeqNumber, p.MNF_Date, p.Pair,
                SepPos = NULLIF(CHARINDEX('[|]', p.Pair), 0)
        FROM    Pairs p
        WHERE   p.Pair <> ''
)
SELECT  s.MNF_SeqNumber,
        s.MNF_Date,
        KeyName  = CASE WHEN s.SepPos IS NULL THEN s.Pair                          -- no '[|]': show the whole token as the key
                        ELSE LEFT(s.Pair, s.SepPos - 1) END,
        KeyValue = CASE WHEN s.SepPos IS NULL THEN NULL
                        ELSE SUBSTRING(s.Pair, s.SepPos + 3, LEN(s.Pair)) END,
        RawPair  = s.Pair
FROM    Split s
ORDER BY s.MNF_Date DESC, s.MNF_SeqNumber DESC, KeyName;

-- 5. Summary: error counts by title / error message for the window
--    XML methods cannot appear in GROUP BY (Msg 4148): shred in a derived table, then group on plain columns.
SELECT  d.MsgTitle,
        d.ErrorTitle,
        Cnt        = COUNT(*),
        FirstSeen  = MIN(d.MNF_Date),
        LastSeen   = MAX(d.MNF_Date)
FROM (
        SELECT  x.MNF_Date,
                MsgTitle   = LTRIM(RTRIM(REPLACE(REPLACE(x.MsgXml.value('(/Message/Title/text())[1]', 'NVARCHAR(200)'), CHAR(13), ''), CHAR(10), ''))),
                ErrorTitle = x.MsgXml.value('(/Message/Content/NodeError/ErrorTitle/text())[1]', 'NVARCHAR(200)')
        FROM    #Xml x
     ) d
GROUP BY d.MsgTitle, d.ErrorTitle
ORDER BY Cnt DESC;

-- 6. Where ioSRVLetter.exe shows up: which XML node carries the service name, and how often per day
--    (run with @SearchText = N'ioSRVLetter'; empty result = nothing in the window mentions it)
SELECT  d.MsgDay,
        d.MsgService,
        Cnt        = COUNT(*),
        FirstSeq   = MIN(d.MNF_SeqNumber),
        LastSeq    = MAX(d.MNF_SeqNumber)
FROM (
        SELECT  x.MNF_SeqNumber,
                MsgDay     = CAST(x.MNF_Date AS DATE),
                MsgService = LTRIM(RTRIM(REPLACE(REPLACE(x.MsgXml.value('(/Message/Service/text())[1]', 'NVARCHAR(50)'), CHAR(13), ''), CHAR(10), '')))
        FROM    #Xml x
        WHERE   @SearchText IS NOT NULL
     ) d
GROUP BY d.MsgDay, d.MsgService
ORDER BY d.MsgDay DESC, Cnt DESC;
