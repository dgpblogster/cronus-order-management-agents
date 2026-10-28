-- CRONUS demo database for the mcp-cronus MCP server.
-- Schema and data extracted from the demo database used in the
-- DynamicsCon 2026 session "Multi-Agent Orchestration".
--
-- This is NOT a Business Central database. It is a small purpose-built
-- schema of six tables holding fictional CRONUS USA, Inc. data.
--
-- Run against an empty database:
--   sqlcmd -S localhost -d Cronus -i cronus-demo.sql

SET NOCOUNT ON;
GO

-- Drop existing objects (reverse order of creation)
IF OBJECT_ID('dbo.OrderHistory', 'U') IS NOT NULL DROP TABLE dbo.OrderHistory;
IF OBJECT_ID('dbo.Inventory', 'U') IS NOT NULL DROP TABLE dbo.Inventory;
IF OBJECT_ID('dbo.Pricing', 'U') IS NOT NULL DROP TABLE dbo.Pricing;
IF OBJECT_ID('dbo.CreditProfiles', 'U') IS NOT NULL DROP TABLE dbo.CreditProfiles;
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;
IF OBJECT_ID('dbo.Customers', 'U') IS NOT NULL DROP TABLE dbo.Customers;
GO

-- Customers
CREATE TABLE dbo.Customers (
    CustomerNo NVARCHAR(20) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Address NVARCHAR(200) NULL,
    City NVARCHAR(50) NULL,
    State NVARCHAR(20) NULL,
    PostalCode NVARCHAR(20) NULL,
    Country NVARCHAR(50) NULL,
    PhoneNo NVARCHAR(30) NULL,
    Email NVARCHAR(100) NULL,
    PaymentTermsCode NVARCHAR(20) NULL,
    CustomerPostingGroup NVARCHAR(20) NULL,
    CurrencyCode NVARCHAR(10) DEFAULT ('USD') NOT NULL,
    SalespersonCode NVARCHAR(20) NULL,
    CreatedDate DATE NOT NULL,
    LastModifiedDate DATE NULL,
    IsActive BIT DEFAULT ((1)) NOT NULL,
    CONSTRAINT PK_Customers PRIMARY KEY (CustomerNo)
);
GO

INSERT INTO dbo.Customers (CustomerNo, Name, Address, City, State, PostalCode, Country, PhoneNo, Email, PaymentTermsCode, CustomerPostingGroup, CurrencyCode, SalespersonCode, CreatedDate, LastModifiedDate, IsActive) VALUES (N'10000', N'Adatum Corporation', N'192 Market Square', N'Atlanta', N'GA', N'31772', N'US', N'+1-404-555-0100', N'orders@adatum-corp.com', N'NET30', N'DOMESTIC', N'USD', N'MO', '2019-03-14', '2026-09-15', 1);
INSERT INTO dbo.Customers (CustomerNo, Name, Address, City, State, PostalCode, Country, PhoneNo, Email, PaymentTermsCode, CustomerPostingGroup, CurrencyCode, SalespersonCode, CreatedDate, LastModifiedDate, IsActive) VALUES (N'10095', N'Adatum Holdings, Inc.', NULL, N'Atlanta', N'GA', NULL, N'US', NULL, NULL, N'NET15', N'DOMESTIC', N'USD', NULL, '2023-11-08', '2023-11-08', 1);
INSERT INTO dbo.Customers (CustomerNo, Name, Address, City, State, PostalCode, Country, PhoneNo, Email, PaymentTermsCode, CustomerPostingGroup, CurrencyCode, SalespersonCode, CreatedDate, LastModifiedDate, IsActive) VALUES (N'20000', N'Trey Research', N'153 Thomas Drive', N'Chicago', N'IL', N'61236', N'US', N'+1-312-555-0140', N'ap@treyresearch.com', N'NET30', N'DOMESTIC', N'USD', N'PS', '2020-07-22', '2026-08-30', 1);
INSERT INTO dbo.Customers (CustomerNo, Name, Address, City, State, PostalCode, Country, PhoneNo, Email, PaymentTermsCode, CustomerPostingGroup, CurrencyCode, SalespersonCode, CreatedDate, LastModifiedDate, IsActive) VALUES (N'30000', N'School of Fine Art', N'2300 University Lane', N'Miami', N'FL', N'37125', N'US', N'+1-305-555-0180', N'accounts@sfa.edu', N'NET45', N'EDUCATION', N'USD', N'JR', '2018-09-01', '2026-07-12', 1);
INSERT INTO dbo.Customers (CustomerNo, Name, Address, City, State, PostalCode, Country, PhoneNo, Email, PaymentTermsCode, CustomerPostingGroup, CurrencyCode, SalespersonCode, CreatedDate, LastModifiedDate, IsActive) VALUES (N'40000', N'Alpine Ski House', N'4452 Mountain View Road', N'Denver', N'CO', N'80014', N'US', N'+1-303-555-0145', N'orders@alpineski.com', N'NET30', N'DOMESTIC', N'USD', N'PS', '2021-01-18', '2026-09-05', 1);
INSERT INTO dbo.Customers (CustomerNo, Name, Address, City, State, PostalCode, Country, PhoneNo, Email, PaymentTermsCode, CustomerPostingGroup, CurrencyCode, SalespersonCode, CreatedDate, LastModifiedDate, IsActive) VALUES (N'50000', N'Relecloud', N'989 Cloud Avenue', N'Seattle', N'WA', N'98101', N'US', N'+1-206-555-0190', N'procurement@relecloud.com', N'NET30', N'DOMESTIC', N'USD', N'MO', '2022-05-30', '2026-09-22', 1);
GO

-- Products
CREATE TABLE dbo.Products (
    ItemNo NVARCHAR(20) NOT NULL,
    Description NVARCHAR(200) NOT NULL,
    ItemCategoryCode NVARCHAR(20) NULL,
    BaseUOM NVARCHAR(10) DEFAULT ('PCS') NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    UnitCost DECIMAL(18,2) NULL,
    IsActive BIT DEFAULT ((1)) NOT NULL,
    CONSTRAINT PK_Products PRIMARY KEY (ItemNo)
);
GO

INSERT INTO dbo.Products (ItemNo, Description, ItemCategoryCode, BaseUOM, UnitPrice, UnitCost, IsActive) VALUES (N'1896-S', N'ATHENS Desk', N'DESK', N'PCS', 800, 480, 1);
INSERT INTO dbo.Products (ItemNo, Description, ItemCategoryCode, BaseUOM, UnitPrice, UnitCost, IsActive) VALUES (N'1900-S', N'PARIS Guest Chair, black', N'CHAIR', N'PCS', 200, 110, 1);
INSERT INTO dbo.Products (ItemNo, Description, ItemCategoryCode, BaseUOM, UnitPrice, UnitCost, IsActive) VALUES (N'1908-S', N'LONDON Swivel Chair, blue', N'CHAIR', N'PCS', 220, 120, 1);
INSERT INTO dbo.Products (ItemNo, Description, ItemCategoryCode, BaseUOM, UnitPrice, UnitCost, IsActive) VALUES (N'1920-S', N'ANTWERP Conference Table', N'TABLE', N'PCS', 1200, 720, 1);
INSERT INTO dbo.Products (ItemNo, Description, ItemCategoryCode, BaseUOM, UnitPrice, UnitCost, IsActive) VALUES (N'1928-S', N'AMSTERDAM Lamp', N'LAMP', N'PCS', 90, 50, 1);
INSERT INTO dbo.Products (ItemNo, Description, ItemCategoryCode, BaseUOM, UnitPrice, UnitCost, IsActive) VALUES (N'1936-S', N'BERLIN Guest Chair, yellow', N'CHAIR', N'PCS', 210, 115, 1);
GO

-- CreditProfiles
CREATE TABLE dbo.CreditProfiles (
    CustomerNo NVARCHAR(20) NOT NULL,
    CreditLimit DECIMAL(18,2) DEFAULT ((0)) NOT NULL,
    BalanceLCY DECIMAL(18,2) DEFAULT ((0)) NOT NULL,
    DaysPastDue INT DEFAULT ((0)) NOT NULL,
    LastReviewDate DATE NULL,
    PaymentHistoryRating NVARCHAR(10) NULL,
    OnHold BIT DEFAULT ((0)) NOT NULL,
    ReviewThresholdPct DECIMAL(5,2) DEFAULT ((85.00)) NOT NULL,
    CONSTRAINT PK_CreditProfiles PRIMARY KEY (CustomerNo)
);
GO

INSERT INTO dbo.CreditProfiles (CustomerNo, CreditLimit, BalanceLCY, DaysPastDue, LastReviewDate, PaymentHistoryRating, OnHold, ReviewThresholdPct) VALUES (N'10000', 250000, 116000, 0, '2026-09-01', N'A', 0, 85);
INSERT INTO dbo.CreditProfiles (CustomerNo, CreditLimit, BalanceLCY, DaysPastDue, LastReviewDate, PaymentHistoryRating, OnHold, ReviewThresholdPct) VALUES (N'10095', 50000, 0, 0, NULL, NULL, 0, 85);
INSERT INTO dbo.CreditProfiles (CustomerNo, CreditLimit, BalanceLCY, DaysPastDue, LastReviewDate, PaymentHistoryRating, OnHold, ReviewThresholdPct) VALUES (N'20000', 100000, 32000, 0, '2026-08-15', N'A', 0, 85);
INSERT INTO dbo.CreditProfiles (CustomerNo, CreditLimit, BalanceLCY, DaysPastDue, LastReviewDate, PaymentHistoryRating, OnHold, ReviewThresholdPct) VALUES (N'30000', 75000, 18500, 15, '2026-07-20', N'B', 0, 85);
INSERT INTO dbo.CreditProfiles (CustomerNo, CreditLimit, BalanceLCY, DaysPastDue, LastReviewDate, PaymentHistoryRating, OnHold, ReviewThresholdPct) VALUES (N'40000', 150000, 89000, 0, '2026-08-25', N'A', 0, 85);
INSERT INTO dbo.CreditProfiles (CustomerNo, CreditLimit, BalanceLCY, DaysPastDue, LastReviewDate, PaymentHistoryRating, OnHold, ReviewThresholdPct) VALUES (N'50000', 200000, 142000, 0, '2026-09-10', N'A', 0, 85);
GO

-- Pricing
CREATE TABLE dbo.Pricing (
    PricingId INT IDENTITY(1,1) NOT NULL,
    CustomerNo NVARCHAR(20) NOT NULL,
    ItemNo NVARCHAR(20) NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    MinimumQuantity DECIMAL(18,2) DEFAULT ((0)) NOT NULL,
    StartingDate DATE NOT NULL,
    EndingDate DATE NULL,
    CONSTRAINT PK_Pricing PRIMARY KEY (PricingId)
);
GO

SET IDENTITY_INSERT dbo.Pricing ON;
INSERT INTO dbo.Pricing (PricingId, CustomerNo, ItemNo, UnitPrice, MinimumQuantity, StartingDate, EndingDate) VALUES (1, N'10000', N'1900-S', 190, 100, '2025-01-01', '2026-12-31');
INSERT INTO dbo.Pricing (PricingId, CustomerNo, ItemNo, UnitPrice, MinimumQuantity, StartingDate, EndingDate) VALUES (2, N'10000', N'1896-S', 760, 10, '2025-01-01', '2026-12-31');
INSERT INTO dbo.Pricing (PricingId, CustomerNo, ItemNo, UnitPrice, MinimumQuantity, StartingDate, EndingDate) VALUES (3, N'20000', N'1900-S', 195, 50, '2025-01-01', '2026-12-31');
INSERT INTO dbo.Pricing (PricingId, CustomerNo, ItemNo, UnitPrice, MinimumQuantity, StartingDate, EndingDate) VALUES (4, N'40000', N'1908-S', 210, 25, '2025-06-01', '2026-12-31');
INSERT INTO dbo.Pricing (PricingId, CustomerNo, ItemNo, UnitPrice, MinimumQuantity, StartingDate, EndingDate) VALUES (5, N'50000', N'1920-S', 1140, 5, '2025-03-01', '2026-12-31');
SET IDENTITY_INSERT dbo.Pricing OFF;
GO

-- Inventory
CREATE TABLE dbo.Inventory (
    InventoryId INT IDENTITY(1,1) NOT NULL,
    ItemNo NVARCHAR(20) NOT NULL,
    LocationCode NVARCHAR(20) NOT NULL,
    QuantityOnHand DECIMAL(18,2) DEFAULT ((0)) NOT NULL,
    QuantityAllocated DECIMAL(18,2) DEFAULT ((0)) NOT NULL,
    QuantityInbound DECIMAL(18,2) DEFAULT ((0)) NOT NULL,
    InboundExpectedDate DATE NULL,
    LastUpdated DATETIME2(7) DEFAULT (sysutcdatetime()) NOT NULL,
    CONSTRAINT PK_Inventory PRIMARY KEY (InventoryId)
);
GO

SET IDENTITY_INSERT dbo.Inventory ON;
INSERT INTO dbo.Inventory (InventoryId, ItemNo, LocationCode, QuantityOnHand, QuantityAllocated, QuantityInbound, InboundExpectedDate, LastUpdated) VALUES (1, N'1900-S', N'MAIN', 300, 0, 0, NULL, '2026-05-12 14:15:47.889');
INSERT INTO dbo.Inventory (InventoryId, ItemNo, LocationCode, QuantityOnHand, QuantityAllocated, QuantityInbound, InboundExpectedDate, LastUpdated) VALUES (2, N'1900-S', N'EAST', 150, 0, 0, NULL, '2026-05-12 14:15:47.889');
INSERT INTO dbo.Inventory (InventoryId, ItemNo, LocationCode, QuantityOnHand, QuantityAllocated, QuantityInbound, InboundExpectedDate, LastUpdated) VALUES (3, N'1900-S', N'WEST', 0, 0, 50, '2026-05-15', '2026-05-12 14:15:47.889');
INSERT INTO dbo.Inventory (InventoryId, ItemNo, LocationCode, QuantityOnHand, QuantityAllocated, QuantityInbound, InboundExpectedDate, LastUpdated) VALUES (4, N'1896-S', N'MAIN', 45, 5, 20, '2026-05-19', '2026-05-12 14:15:47.889');
INSERT INTO dbo.Inventory (InventoryId, ItemNo, LocationCode, QuantityOnHand, QuantityAllocated, QuantityInbound, InboundExpectedDate, LastUpdated) VALUES (5, N'1896-S', N'EAST', 22, 0, 0, NULL, '2026-05-12 14:15:47.889');
INSERT INTO dbo.Inventory (InventoryId, ItemNo, LocationCode, QuantityOnHand, QuantityAllocated, QuantityInbound, InboundExpectedDate, LastUpdated) VALUES (6, N'1908-S', N'MAIN', 180, 12, 0, NULL, '2026-05-12 14:15:47.889');
INSERT INTO dbo.Inventory (InventoryId, ItemNo, LocationCode, QuantityOnHand, QuantityAllocated, QuantityInbound, InboundExpectedDate, LastUpdated) VALUES (7, N'1908-S', N'WEST', 60, 0, 0, NULL, '2026-05-12 14:15:47.889');
INSERT INTO dbo.Inventory (InventoryId, ItemNo, LocationCode, QuantityOnHand, QuantityAllocated, QuantityInbound, InboundExpectedDate, LastUpdated) VALUES (8, N'1920-S', N'MAIN', 8, 2, 4, '2026-05-26', '2026-05-12 14:15:47.889');
INSERT INTO dbo.Inventory (InventoryId, ItemNo, LocationCode, QuantityOnHand, QuantityAllocated, QuantityInbound, InboundExpectedDate, LastUpdated) VALUES (9, N'1928-S', N'EAST', 64, 0, 0, NULL, '2026-05-12 14:15:47.889');
INSERT INTO dbo.Inventory (InventoryId, ItemNo, LocationCode, QuantityOnHand, QuantityAllocated, QuantityInbound, InboundExpectedDate, LastUpdated) VALUES (10, N'1936-S', N'WEST', 95, 5, 0, NULL, '2026-05-12 14:15:47.889');
SET IDENTITY_INSERT dbo.Inventory OFF;
GO

-- OrderHistory
CREATE TABLE dbo.OrderHistory (
    DocumentNo NVARCHAR(20) NOT NULL,
    CustomerNo NVARCHAR(20) NOT NULL,
    OrderDate DATE NOT NULL,
    PostingDate DATE NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Status NVARCHAR(20) NOT NULL,
    SalespersonCode NVARCHAR(20) NULL,
    CONSTRAINT PK_OrderHistory PRIMARY KEY (DocumentNo)
);
GO

INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-101001', N'10000', '2025-04-12', '2025-04-15', 2800, N'Invoiced', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-101015', N'10000', '2025-06-08', '2025-06-12', 4200, N'Invoiced', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-101032', N'10000', '2025-08-15', '2025-08-19', 5100, N'Invoiced', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-101054', N'10000', '2025-10-03', '2025-10-07', 6800, N'Invoiced', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-101078', N'10000', '2025-12-14', '2025-12-18', 8500, N'Invoiced', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-101105', N'10000', '2026-01-22', '2026-01-27', 11200, N'Invoiced', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-101138', N'10000', '2026-03-18', '2026-03-23', 14600, N'Invoiced', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-101171', N'10000', '2026-05-09', '2026-05-13', 19400, N'Invoiced', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-101204', N'10000', '2026-06-25', '2026-06-30', 25800, N'Invoiced', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-101244', N'10000', '2026-07-30', '2026-08-04', 38200, N'Invoiced', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-101284', N'10000', '2026-08-22', '2026-08-27', 51400, N'Invoiced', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-101324', N'10000', '2026-09-15', NULL, 26600, N'Open', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-102003', N'20000', '2026-04-08', '2026-04-12', 12500, N'Invoiced', N'PS');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-102045', N'20000', '2026-06-22', '2026-06-26', 18900, N'Invoiced', N'PS');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-102089', N'20000', '2026-08-14', '2026-08-19', 9800, N'Invoiced', N'PS');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-102110', N'20000', '2026-09-05', NULL, 32000, N'Open', N'PS');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-103022', N'30000', '2026-05-18', '2026-05-22', 6200, N'Invoiced', N'JR');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-103044', N'30000', '2026-07-12', '2026-07-16', 12300, N'Invoiced', N'JR');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-103056', N'30000', '2026-08-30', NULL, 18500, N'Open', N'JR');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-104011', N'40000', '2026-03-25', '2026-03-29', 28500, N'Invoiced', N'PS');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-104034', N'40000', '2026-06-14', '2026-06-18', 35200, N'Invoiced', N'PS');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-104067', N'40000', '2026-08-22', '2026-08-26', 25300, N'Invoiced', N'PS');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-104088', N'40000', '2026-09-05', NULL, 89000, N'Open', N'PS');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-105025', N'50000', '2026-05-30', '2026-06-03', 42500, N'Invoiced', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-105056', N'50000', '2026-07-18', '2026-07-22', 55600, N'Invoiced', N'MO');
INSERT INTO dbo.OrderHistory (DocumentNo, CustomerNo, OrderDate, PostingDate, Amount, Status, SalespersonCode) VALUES (N'SO-105089', N'50000', '2026-09-12', NULL, 44000, N'Open', N'MO');
GO

