CREATE DATABASE IF NOT EXISTS `devtoolcommdb`;
USE `devtoolcommdb`;

CREATE TABLE IF NOT EXISTS `chaincode` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `ChaincodeId` varchar(255) DEFAULT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Path` varchar(255) DEFAULT NULL,
  `Size` int(11) DEFAULT NULL,
  `Type` varchar(10) DEFAULT NULL,
  `Status` varchar(10) DEFAULT NULL,
  `Version` decimal(10,2) DEFAULT NULL,
  `Language` varchar(45) DEFAULT NULL,
  `IsInit` tinyint(1) DEFAULT '0',
  `Description` longtext,
  `InitStatus` varchar(10) DEFAULT NULL,
  `UpgradeStatus` varchar(10) DEFAULT NULL,
  `Message` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Id`)
);

CREATE TABLE IF NOT EXISTS `network` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(45) DEFAULT NULL,
  `Org1Name` varchar(45) DEFAULT NULL,
  `Org2Name` varchar(45) DEFAULT NULL,
  `ChannelName` varchar(45) DEFAULT NULL,
  `Version` varchar(45) DEFAULT NULL,
  `Status` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`Id`)
);

DROP PROCEDURE IF EXISTS `update_chaincode`;
CREATE PROCEDURE `update_chaincode`(in _chaincodeid varchar(255), in _path varchar(255), in _size int, in _name varchar(255), in _version decimal(10,2), in _language varchar(45))
BEGIN
	update chaincode set Size = _size, Path = _path, Version = _version, `Name` = _name, `Language` = _language where ChaincodeId = _chaincodeid and Id <> 0;
END ;