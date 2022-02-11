// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { PaymentSplitterWithFeeUpgradeable } from "../minters/PaymentSplitterWithFeeUpgradeable.sol";

contract PaymentSplitterWithFeeUpgradeableDerived is Initializable, PaymentSplitterWithFeeUpgradeable {
    function initialize(
        address[] memory payees,
        uint256[] memory shares_,
        address payable serviceFeeAddress_,
        uint256 serviceFeeBasisPoints_
    ) external initializer {
        __PaymentSplitterWithFee_init(payees, shares_, serviceFeeAddress_, serviceFeeBasisPoints_);
    }

    function setServiceFeeBasisPoints(uint256 serviceFeeBasisPoints_) public {
        _setServiceFeeBasisPoints(serviceFeeBasisPoints_);
    }

    function setServiceFeeAddress(address payable serviceFeeAddress_) public {
        _setServiceFeeAddress(serviceFeeAddress_);
    }
}
