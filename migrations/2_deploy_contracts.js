const Sherbet = artifacts.require("Sherbet");

module.exports = async (deployer) => {
    await deployer.deploy(Sherbet, "Sherbet", "SHBT", "testuri");
}