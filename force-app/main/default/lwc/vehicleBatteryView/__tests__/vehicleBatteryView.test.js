import { createElement } from '@lwc/engine-dom';
import VehicleBatteryView from 'c/vehicleBatteryView';

describe('c-vehicle-battery-view', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders vehicle image correctly', () => {
        const element = createElement('c-vehicle-battery-view', {
            is: VehicleBatteryView
        });
        document.body.appendChild(element);

        const vehicleImage = element.shadowRoot.querySelector('.vehicle-image');
        expect(vehicleImage).toBeTruthy();
        expect(vehicleImage.alt).toBe('Vehicle with Battery');
    });

    it('shows battery tooltip on mouse enter', async () => {
        const element = createElement('c-vehicle-battery-view', {
            is: VehicleBatteryView
        });
        document.body.appendChild(element);

        const vehicleImage = element.shadowRoot.querySelector('.vehicle-image');
        vehicleImage.dispatchEvent(new CustomEvent('mouseenter'));

        await Promise.resolve();

        const tooltip = element.shadowRoot.querySelector('.battery-tooltip');
        expect(tooltip).toBeTruthy();
    });

    it('hides battery tooltip on mouse leave', async () => {
        const element = createElement('c-vehicle-battery-view', {
            is: VehicleBatteryView
        });
        document.body.appendChild(element);

        const vehicleImage = element.shadowRoot.querySelector('.vehicle-image');
        
        // Show tooltip
        vehicleImage.dispatchEvent(new CustomEvent('mouseenter'));
        await Promise.resolve();
        
        // Hide tooltip
        vehicleImage.dispatchEvent(new CustomEvent('mouseleave'));
        await Promise.resolve();

        const tooltip = element.shadowRoot.querySelector('.battery-tooltip');
        expect(tooltip).toBeFalsy();
    });

    it('displays correct battery information', () => {
        const element = createElement('c-vehicle-battery-view', {
            is: VehicleBatteryView
        });
        document.body.appendChild(element);

        // Check if battery info is properly displayed in component
        expect(element.batteryInfo.type).toBe('Lithium-ion');
        expect(element.batteryInfo.currentLevel).toBe(85);
        expect(element.batteryInfo.health).toBe(95);
    });
});