// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameItems is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("GameItems", "GITM") Ownable(msg.sender) {}

    function mintItem(address player, string memory uri) 
        public 
        onlyOwner 
        returns (uint256) 
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(player, tokenId);
        _setTokenURI(tokenId, uri);

        return tokenId;
    }
}
