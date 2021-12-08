// truffle test --compile-none

var chai = require("./setupchai.js");
const BN = web3.utils.BN;
const expect = chai.expect;
const truffleAssert = require('truffle-assertions');


const Sherbet = artifacts.require("./Sherbet")

contract('SherbetNFT', accounts => {

  const [deployer] = accounts;
  let sherbet


  beforeEach(async () => {
    sherbet = await Sherbet.new("Sherbet", "SHBT", "testuri")
  })

  
  it('has default values', async () => {

    expect(await sherbet.maxSupply()).to.be.a.bignumber.equal(new BN(6)) // 7777 in actual
    expect(await sherbet.cost()).to.be.a.bignumber.equal(new BN(web3.utils.toWei('0.077', 'ether')))

    expect(await sherbet.preSaleStatus()).to.equal(false)
    expect(await sherbet.publicSaleStatus()).to.equal(false)


    expect(await sherbet.name()).to.equal('Sherbet')
    expect(await sherbet.symbol()).to.equal('SHBT')
    expect(await sherbet.baseTokenURI()).to.equal('testuri')

    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(0))

    expect(await sherbet.maxMintable()).to.be.a.bignumber.equal(new BN(0))

  })

  
  it('can change sale status', async () => {

    // initial values
    expect(await sherbet.preSaleStatus()).to.equal(false)
    expect(await sherbet.publicSaleStatus()).to.equal(false)
    expect(await sherbet.maxMintable()).to.be.a.bignumber.equal(new BN(0))

    // only pre sale live
    await sherbet.setPreSaleStatus(true)
    expect(await sherbet.preSaleStatus()).to.equal(true)
    expect(await sherbet.publicSaleStatus()).to.equal(false)
    expect(await sherbet.maxMintable()).to.be.a.bignumber.equal(new BN(2))

    // only general live
    await sherbet.setPublicSaleStatus(true)
    expect(await sherbet.preSaleStatus()).to.equal(false)
    expect(await sherbet.publicSaleStatus()).to.equal(true)
    expect(await sherbet.maxMintable()).to.be.a.bignumber.equal(new BN(5))
  
    // everyhting not live
    await sherbet.setPublicSaleStatus(false)
    expect(await sherbet.preSaleStatus()).to.equal(false)
    expect(await sherbet.publicSaleStatus()).to.equal(false)
    expect(await sherbet.maxMintable()).to.be.a.bignumber.equal(new BN(0))

  })

  
  it('owner can set mint cost', async () => {

    expect(await sherbet.cost()).to.be.a.bignumber.equal(new BN(web3.utils.toWei('0.077', 'ether')))
    await sherbet.setCost(web3.utils.toWei('1', 'ether'))
    expect(await sherbet.cost()).to.be.a.bignumber.equal(new BN(web3.utils.toWei('1', 'ether')))
    
  })

  it('can airdrop tokens', async () => {

    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(0))

    await sherbet.airDrop([accounts[4], accounts[5]])
    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(2))
    expect(await sherbet.balanceOf(accounts[4])).to.be.a.bignumber.equal(new BN(1))
    expect(await sherbet.balanceOf(accounts[5])).to.be.a.bignumber.equal(new BN(1))
    
  })
  
  
  
  it('Pre sale works, max of 2 per address, 3 total pre sale mints max', async () => { // 2000 pre sale mints in actual
    
    // pre sale not live 
    await truffleAssert.reverts(
      sherbet.mint(1, { value: 0.077e18, from: accounts[8] }),
      "It's not time yet"
    );

    await sherbet.setPreSaleStatus(true)
    expect(await sherbet.preSaleStatus()).to.equal(true)

    // not on whitelist
    await truffleAssert.reverts(
      sherbet.mint(1, { value: 0.077e18, from: accounts[8] }),
      "Not on whitelist or maximum of 2 mints per address allowed"
    );
    
    await sherbet.whitelistAddresses([accounts[8], accounts[9]])

    // wrong amount of ether sent
    await truffleAssert.reverts(
      sherbet.mint(1, { value: 0.03e18, from: accounts[8] }),
      "Incorrect funds supplied"
    );

    // tries to mint more than 2 at pre sale
    await truffleAssert.reverts(
      sherbet.mint(3, { value: 0.231e18, from: accounts[8] }),
      "Maximum of 2 mints allowed"
    );

    await sherbet.mint(1, { value: 0.077e18, from: accounts[8] })
    expect(await sherbet.balanceOf(accounts[8])).to.be.a.bignumber.equal(new BN(1))
    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(1))

    // tries to mint 2 after already minting 1
    await truffleAssert.reverts(
      sherbet.mint(2, { value: 0.154e18, from: accounts[8] }),
      "Not on whitelist or maximum of 2 mints per address allowed"
    );

    await sherbet.mint(1, { value: 0.077e18, from: accounts[8] })
    expect(await sherbet.balanceOf(accounts[8])).to.be.a.bignumber.equal(new BN(2))
    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(2))

    // tries to mint a 3rd token
    await truffleAssert.reverts(
      sherbet.mint(1, { value: 0.077e18, from: accounts[8] }),
      "Not on whitelist or maximum of 2 mints per address allowed"
    );

    await sherbet.mint(1, { value: 0.077e18, from: accounts[9] })
    expect(await sherbet.balanceOf(accounts[9])).to.be.a.bignumber.equal(new BN(1))
    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(3))

    // tries to mint when all pre sale tokens sold
    await truffleAssert.reverts(
      sherbet.mint(1, { value: 0.077e18, from: accounts[9] }),
      "Minting that many would exceed pre sale minting allocation"
    );

    expect(await sherbet.balanceOf(accounts[9])).to.be.a.bignumber.equal(new BN(1))
    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(3))

  })

  


  it('can mint from general sale but no more than MAX_SUPPLY', async () => {

    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(0))

    // tries to mint before general sale live
    await truffleAssert.reverts(
      sherbet.mint(1, { value: 0.077e18, from: accounts[9] }),
      "It's not time yet"
    );

    await sherbet.setPublicSaleStatus(true)
    expect(await sherbet.publicSaleStatus()).to.equal(true)

    // tries to mint more than 5 tokens
    await truffleAssert.reverts(
      sherbet.mint(6, { value: 0.462e18, from: accounts[9] }),
      "Maximum of 5 mints allowed"
    );

    await sherbet.mint(4, { value: 0.308e18, from: accounts[9] })

    // tries to mint tokens that would exceed MAX_SUPPLY
    await truffleAssert.reverts(
      sherbet.mint(3, { value: 0.231e18, from: accounts[9] }),
      "All tokens have been minted"
    );

    await sherbet.mint(2, { value: 0.154e18, from: accounts[9] })
    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(6))
    
    
  })

  

  it('returns token URI but only for minted tokens', async () => {

    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(0))

    await sherbet.setPublicSaleStatus(true)
    expect(await sherbet.publicSaleStatus()).to.equal(true)

    // tries to read tokenURI for token yet to be minted
    await truffleAssert.reverts(
      sherbet.tokenURI(1),
      "ERC721Metadata: URI query for nonexistent token"
    );
    
    await sherbet.mint(1, { value: 0.077e18, from: accounts[9] })
    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(1))
    expect(await sherbet.tokenURI(1)).to.equal('testuri1')

    await sherbet.mint(1, { value: 0.077e18, from: accounts[9] })
    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(2))
    expect(await sherbet.tokenURI(2)).to.equal('testuri2')
    
  })


  it('can set base URI', async () => {

    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(0))
    await sherbet.setPublicSaleStatus(true)
    expect(await sherbet.publicSaleStatus()).to.equal(true)

    await sherbet.mint(1, { value: 0.077e18, from: accounts[9] })
    expect(await sherbet.totalSupply()).to.be.a.bignumber.equal(new BN(1))
    expect(await sherbet.tokenURI(1)).to.equal('testuri1')

    await sherbet.setBaseUri('editedBaseURI')
    expect(await sherbet.tokenURI(1)).to.equal('editedBaseURI1')

  })
  

})