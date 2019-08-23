const versionUp = (originalVersion) => {
  // originalVersion format: x.xx
  let newVersion = +originalVersion + 0.01;
  return newVersion;
};

const genChaincodeId = () => {
  const chaincodeId = Math.floor(Math.random() * 1E16);
  return chaincodeId + '';
};

module.exports = {
  versionUp,
  genChaincodeId
};