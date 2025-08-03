import { createElement } from '@lwc/engine-dom';
import OrderDeliveryStatus from 'c/orderDeliveryStatus';

describe('c-order-delivery-status', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders without crashing', () => {
        const element = createElement('c-order-delivery-status', {
            is: OrderDeliveryStatus
        });
        document.body.appendChild(element);
        expect(element).toBeTruthy();
    });

    it('shows loading spinner initially', () => {
        const element = createElement('c-order-delivery-status', {
            is: OrderDeliveryStatus
        });
        element.recordId = '801xx0000000001';
        document.body.appendChild(element);

        const spinner = element.shadowRoot.querySelector('lightning-spinner');
        expect(spinner).toBeTruthy();
    });

    it('handles missing recordId gracefully', () => {
        const element = createElement('c-order-delivery-status', {
            is: OrderDeliveryStatus
        });
        document.body.appendChild(element);
        expect(element).toBeTruthy();
    });
});