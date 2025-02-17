// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/OnchainRiddle.sol";

contract OnchainRiddleTest is Test {
    OnchainRiddle public onchainRiddle;
    address public bot = address(1);
    address public user = address(2);
    address public anotherUser = address(3);

    // Precompute the answer hash for the answer "42"
    bytes32 public answerHash = keccak256(abi.encodePacked("42"));

    function setUp() public {
        // Deploy the contract with the bot as the deployer
        vm.prank(bot);
        onchainRiddle = new OnchainRiddle();
    }

    function testSetRiddleByBot() public {
        // The bot sets the riddle
        vm.prank(bot);
        onchainRiddle.setRiddle("What is the answer to life, the universe, and everything?", answerHash);

        // Verify that the riddle was set correctly
        assertEq(onchainRiddle.riddle(), "What is the answer to life, the universe, and everything?");
        assertTrue(onchainRiddle.isActive());
    }

    function testSetRiddleNotByBot() public {
        // Expect revert if a non-bot attempts to set the riddle
        vm.prank(user);
        vm.expectRevert("Only bot can call this function");
        onchainRiddle.setRiddle("Invalid attempt", answerHash);
    }

    function testSubmitWrongAnswer() public {
        // Set the riddle first
        vm.prank(bot);
        onchainRiddle.setRiddle("Simple riddle", answerHash);

        // A user submits an incorrect answer
        vm.prank(user);
        onchainRiddle.submitAnswer("wrong answer");

        // Verify that no winner has been recorded
        assertEq(onchainRiddle.winner(), address(0));
        // Riddle should still be active
        assertTrue(onchainRiddle.isActive());
    }

    function testSubmitCorrectAnswer() public {
        // Set the riddle
        vm.prank(bot);
        onchainRiddle.setRiddle("Simple riddle", answerHash);

        // The user submits the correct answer
        vm.prank(user);
        onchainRiddle.submitAnswer("42");

        // Verify that the user is recorded as the winner
        assertEq(onchainRiddle.winner(), user);
        // Riddle should no longer be active
        assertFalse(onchainRiddle.isActive());
    }

    function testSubmitAfterSolved() public {
    // Set the riddle and have a user correctly answer it
    vm.prank(bot);
    onchainRiddle.setRiddle("Simple riddle", answerHash);

    vm.prank(user);
    onchainRiddle.submitAnswer("42");

    // Another user attempts to submit an answer after the riddle is solved
    vm.prank(anotherUser);
    vm.expectRevert("No active riddle");
    onchainRiddle.submitAnswer("42");
}
}

