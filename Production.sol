// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/**
 * @dev Modifier 'onlyOwner' becomes available, where owner is the contract deployer
 */
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev ERC721 token standard
 */
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";



contract Sherbet is Ownable, ERC721Enumerable { 

    uint256 public maxSupply = 7777;
    uint256 public maxPreSaleMintTotal = 2000;
    uint256 public cost = 0.077 ether; 
    
    uint256 private preSaleMints;
    string public baseTokenURI;
    
    bool public preSaleStatus = false;
    bool public publicSaleStatus = false;
    

    constructor(
        string memory _name,
        string memory _symbol,  
        string memory _uri
        
    ) ERC721(_name, _symbol) {
        baseTokenURI = _uri;
    }
    
    
    // --- EVENTS ---
    
    event TokenMinted(uint256 tokenId);
    
    
    // --- MAPPINGS ---
    
    mapping(address => uint) whitelist;



        
    // --- PUBLIC ---
    
    
    /**
     * @dev Mint tokens through pre or public sale
     * @param _number - number of tokens to mint
     */
    function mint(
        uint256 _number
    ) external payable {
        
        require(
            msg.value == _number * cost, // mint cost
            "Incorrect funds supplied"
        );

        require(
            totalSupply() + _number <= maxSupply, "All tokens have been minted"
        );
        

        if (publicSaleStatus == true) {

            require(
                _number > 0 && _number <= 5, // mint limit per tx
                "Maximum of 5 mints allowed"
            );


        } else {

            require(
                preSaleStatus, // checks pre sale is live
                "It's not time yet"
            ); 

            require(
                _number > 0 && _number <=2, 
                "Maximum of 2 mints allowed"
            );
            require(
                whitelist[msg.sender] >= _number, // checks if white listed & mint limit per address is obeyed
                "Not on whitelist or maximum of 2 mints per address allowed"
            ); 
            require(
                preSaleMints + _number <= maxPreSaleMintTotal, // ensures pre sale total mint limit is obeyed
                "Minting that many would exceed pre sale minting allocation"
            ); 

            whitelist[msg.sender] -= _number; // reduces caller's minting allownace by the number of tokens they minted
            preSaleMints += _number; 
        }
        
        for (uint256 i = 0; i < _number; i++) {
            uint tokenId = totalSupply() + 1;
            _mint(msg.sender, tokenId);
            emit TokenMinted(tokenId);
        }
    }
    
    
   
    
    
    
    // --- VIEW ---
    
    
    /**
     * @dev Returns tokenURI, which is comprised of the baseURI concatenated with the tokenId
     */
    function tokenURI(uint256 _tokenId) public view override returns(string memory) {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        return string(abi.encodePacked(baseTokenURI, Strings.toString(_tokenId)));
    }


    /**
     * @dev Returns uint of how many tokens can be minted currently. Depends on status of pre and public sale
     */
    function maxMintable() public view returns(uint) {
        if (preSaleStatus == false) {
            if (publicSaleStatus == true) {
                return 5; // public sale
            }
            return 0; // both false
        }
        return 2; // pre sale
    }
    
    
    

    // --- ONLY OWNER ---
    
    
    
    /**
     * @dev Withdraw all ether from smart contract. Only contract owner can call.
     * @param _to - address ether will be sent to
     */
    function withdrawAllFunds(
        address payable _to
    ) external onlyOwner {
        require(
            address(this).balance > 0, 
            "No funds to withdraw"
        );
        _to.transfer(address(this).balance);
    }
    
    
    /**
     * @dev Add addresses to white list, giving access to mint 2 tokens at pre sale
     * @param _addresses - array of address' to add to white list mapping
     */
    function whitelistAddresses(
        address[] calldata _addresses
    ) external onlyOwner {
        for (uint i=0; i<_addresses.length; i++) {
            whitelist[_addresses[i]] = 2;
        }
    }
    
    
    /**
     * @dev Airdrop 1 token to each address in array '_to'
     * @param _to - array of address' that tokens will be sent to
     */
    function airDrop(
        address[] calldata _to
    ) external onlyOwner {
        for (uint i=0; i<_to.length; i++) {
            uint tokenId = totalSupply() + 1;
            require(tokenId <= maxSupply, "All tokens have been minted");
            _mint(_to[i], tokenId);
            emit TokenMinted(tokenId);
        }
        
    }


    /**
     * @dev Set the baseURI string
     */
    function setBaseUri(
        string memory _newBaseUri
    ) external onlyOwner {
        baseTokenURI = _newBaseUri;
    }
    
    
    /**
     * @dev Set the cost of minting a token
     * @param _newCost in Wei. Where 1 Wei = 10^-18 ether
     */
    function setCost(
        uint _newCost
    ) external onlyOwner {
        cost = _newCost;
    }
    
    
    /**
     * @dev Set the status of the pre sale, sets publicSaleStatus to false
     * @param _status boolean where true = live 
     */
    function setPreSaleStatus(
        bool _status
    ) external onlyOwner {

        if (publicSaleStatus) {
            publicSaleStatus = false;
        }
        preSaleStatus = _status;
    }
    
    
    /**
     * @dev Set the status of the public sale, sets preSaleStatus to false
     * @param _status boolean where true = live 
     */
    function setPublicSaleStatus(
        bool _status
    ) external onlyOwner {

        if (preSaleStatus) {
            preSaleStatus = false;
        }
        publicSaleStatus = _status;
    }
    
}