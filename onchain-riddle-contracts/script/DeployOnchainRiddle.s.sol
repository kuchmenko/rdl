// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/OnchainRiddle.sol";

contract DeployOnchainRiddle is Script {
    function run() external {
        // Load your deployer private key from environment variables.
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions to the network.
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract.
        OnchainRiddle onchainRiddle = new OnchainRiddle();

        // Log the deployed address.
        console.log("OnchainRiddle deployed at:", address(onchainRiddle));

        vm.stopBroadcast();
    }
}

