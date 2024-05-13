<?php declare(strict_types=1);

namespace Shopware\Core\Checkout\Payment\Cart\PaymentHandler;

use Shopware\Core\Checkout\Cart\Cart;
use Shopware\Core\Checkout\Payment\Cart\PaymentTransactionStruct;
use Shopware\Core\Checkout\Payment\Cart\RefundPaymentTransactionStruct;
use Shopware\Core\Checkout\Payment\PaymentException;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Log\Package;
use Shopware\Core\Framework\Struct\Struct;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;

#[Package('checkout')]
abstract class AbstractPaymentHandler
{
    abstract public function supports(
        PaymentHandlerType $type,
        string $paymentMethodId,
        Context $context
    ): bool;

    abstract public function pay(
        Request $request,
        PaymentTransactionStruct $transaction,
        Context $context,
        ?Struct $validateStruct
    ): ?RedirectResponse;

    public function validate(
        Cart $cart,
        RequestDataBag $dataBag,
        SalesChannelContext $context
    ): ?Struct {
        return null;
    }

    public function finalize(
        Request $request,
        PaymentTransactionStruct $transaction,
        Context $context
    ): void {
    }

    public function refund(
        RefundPaymentTransactionStruct $transaction,
        Context $context
    ): void {
        PaymentException::paymentHandlerTypeUnsupported($this, PaymentHandlerType::REFUND);
    }

    public function recurring(
        PaymentTransactionStruct $transaction,
        Context $context
    ): void {
        PaymentException::paymentHandlerTypeUnsupported($this, PaymentHandlerType::RECURRING);
    }
}
