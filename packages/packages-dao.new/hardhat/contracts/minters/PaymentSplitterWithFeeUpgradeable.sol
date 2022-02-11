// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title PaymentSplitterWithFeeUpgradeable
 * @dev This is a modified version of OpenZeppelin's PaymentSplitterUpgradeable. It add a "service fee"
 * which is taken whenever a payment is released.
 *
 * OpenZeppelin's PaymentSplitterUpgradeable:
 * This contract allows to split Ether payments among a group of accounts. The sender does not need to be aware
 * that the Ether will be split in this way, since it is handled transparently by the contract.
 *
 * The split can be in equal parts or in any other arbitrary proportion. The way this is specified is by assigning each
 * account to a number of shares. Of all the Ether that this contract receives, each account will then be able to claim
 * an amount proportional to the percentage of total shares they were assigned.
 *
 * `PaymentSplitter` follows a _pull payment_ model. This means that payments are not automatically forwarded to the
 * accounts but kept in this contract, and the actual transfer is triggered as a separate step by calling the {release}
 * function.
 */
contract PaymentSplitterWithFeeUpgradeable is Initializable, ContextUpgradeable {
    event PayeeAdded(address account, uint256 shares);
    event PaymentReleased(address to, uint256 amount, uint256 fee);
    event PaymentReceived(address from, uint256 amount);
    event ServiceFeeAddressUpdated(address serviceFeeAddress);
    event ServiceFeeBasisPointsUpdated(uint256 serviceFeeBasisPoints);

    uint256 private _totalShares;
    uint256 private _totalReleased;

    mapping(address => uint256) private _shares;
    mapping(address => uint256) private _released;
    address[] private _payees;

    address payable private serviceFeeAddress;
    uint256 private serviceFeeBasisPoints;

    /**
     * @dev Creates an instance of `PaymentSplitter` where each account in `payees` is assigned the number of shares at
     * the matching position in the `shares` array.
     *
     * All addresses in `payees` must be non-zero. Both arrays must have the same non-zero length, and there must be no
     * duplicates in `payees`.
     */
    function __PaymentSplitterWithFee_init(
        address[] memory payees,
        uint256[] memory shares_,
        address payable serviceFeeAddress_,
        uint256 serviceFeeBasisPoints_
    ) internal onlyInitializing {
        __Context_init_unchained();
        __PaymentSplitterWithFee_init_unchained(payees, shares_, serviceFeeAddress_, serviceFeeBasisPoints_);
    }

    function __PaymentSplitterWithFee_init_unchained(
        address[] memory payees,
        uint256[] memory shares_,
        address payable serviceFeeAddress_,
        uint256 serviceFeeBasisPoints_
    ) internal onlyInitializing {
        require(payees.length == shares_.length, "PaymentSplitter: payees and shares length mismatch");
        require(payees.length > 0, "PaymentSplitter: no payees");
        require(serviceFeeBasisPoints_ <= 10000, "Max fee: 10000");

        for (uint256 i = 0; i < payees.length; i++) {
            _addPayee(payees[i], shares_[i]);
        }

        serviceFeeAddress = serviceFeeAddress_;
        serviceFeeBasisPoints = serviceFeeBasisPoints_;
    }

    /**
     * @dev The Ether received will be logged with {PaymentReceived} events. Note that these events are not fully
     * reliable: it's possible for a contract to receive Ether without triggering this function. This only affects the
     * reliability of the events, and not the actual splitting of Ether.
     *
     * To learn more about this see the Solidity documentation for
     * https://solidity.readthedocs.io/en/latest/contracts.html#fallback-function[fallback
     * functions].
     */
    receive() external payable virtual {
        emit PaymentReceived(_msgSender(), msg.value);
    }

    /**
     * @dev Getter for the total shares held by payees.
     */
    function totalShares() public view returns (uint256) {
        return _totalShares;
    }

    /**
     * @dev Getter for the total amount of Ether already released.
     */
    function totalReleased() public view returns (uint256) {
        return _totalReleased;
    }

    /**
     * @dev Getter for the amount of shares held by an account.
     */
    function shares(address account) public view returns (uint256) {
        return _shares[account];
    }

    /**
     * @dev Getter for the amount of Ether already released to a payee.
     */
    function released(address account) public view returns (uint256) {
        return _released[account];
    }

    /**
     * @dev Getter for the address of the payee number `index`.
     */
    function payee(uint256 index) public view returns (address) {
        return _payees[index];
    }

    /**
     * @dev Triggers a transfer to `account` of the amount of Ether they are owed, according to their percentage of the
     * total shares and their previous withdrawals.
     */
    function release(address payable account) public virtual {
        require(_shares[account] > 0, "PaymentSplitter: account has no shares");

        uint256 totalReceived = address(this).balance + _totalReleased;
        uint256 payment = (totalReceived * _shares[account]) / _totalShares - _released[account];

        require(payment != 0, "PaymentSplitter: account is not due payment");

        _released[account] = _released[account] + payment;
        _totalReleased = _totalReleased + payment;

        _sendPaymentWithFee(account, payment);
    }

    function _sendPaymentWithFee(address payable account, uint256 payment) private {
        uint256 feeAmount = (payment * serviceFeeBasisPoints) / 10000;
        AddressUpgradeable.sendValue(serviceFeeAddress, feeAmount);
        AddressUpgradeable.sendValue(account, payment - feeAmount);
        emit PaymentReleased(account, payment, feeAmount);
    }

    /**
     * @dev Add a new payee to the contract.
     * @param account The address of the payee to add.
     * @param shares_ The number of shares owned by the payee.
     */
    function _addPayee(address account, uint256 shares_) private {
        require(account != address(0), "PaymentSplitter: account is the zero address");
        require(shares_ > 0, "PaymentSplitter: shares are 0");
        require(_shares[account] == 0, "PaymentSplitter: account already has shares");

        _payees.push(account);
        _shares[account] = shares_;
        _totalShares = _totalShares + shares_;
        emit PayeeAdded(account, shares_);
    }

    /**
     * @dev Change the service fee. Derived contracts should decide on access control to this function.
     * @param serviceFeeBasisPoints_ The new service fee in basis points (maximum 10000)
     */
    function _setServiceFeeBasisPoints(uint256 serviceFeeBasisPoints_) internal {
        require(serviceFeeBasisPoints_ <= 10000, "Max fee: 10000");

        serviceFeeBasisPoints = serviceFeeBasisPoints_;
        emit ServiceFeeBasisPointsUpdated(serviceFeeBasisPoints_);
    }

    function getServiceFeeBasisPoints() public view returns (uint256) {
        return serviceFeeBasisPoints;
    }

    /**
     * @dev Change the receiving fee address. Derived contracts should decide on access control to this function
     * @param serviceFeeAddress_ The new address to receive fees.
     */
    function _setServiceFeeAddress(address payable serviceFeeAddress_) internal {
        serviceFeeAddress = serviceFeeAddress_;
        emit ServiceFeeAddressUpdated(serviceFeeAddress_);
    }

    function getServiceFeeAddress() public view returns (address) {
        return serviceFeeAddress;
    }

    uint256[45] private __gap;
}
