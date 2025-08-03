import { createElement } from '@lwc/engine-dom';
import VehicleParts from 'c/vehicleParts';

// Mock data for testing
const mockPartsData = [
    {
        Id: '001000000000001',
        Name: '브레이크 패드',
        Price__c: 150000,
        Category__c: '브레이크 시스템',
        Stock_Quantity__c: 25,
        Stock_Rate__c: 95.0,
        Serial_Number__c: 'BP1176LDE'
    },
    {
        Id: '001000000000002',
        Name: '알터네이터',
        Price__c: 350000,
        Category__c: '전기 시스템',
        Stock_Quantity__c: 12,
        Stock_Rate__c: 78.0,
        Serial_Number__c: 'AT1E89KWE'
    }
];

describe('c-vehicle-parts', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders component with title', () => {
        const element = createElement('c-vehicle-parts', {
            is: VehicleParts
        });
        document.body.appendChild(element);

        const title = element.shadowRoot.querySelector('.parts-title');
        expect(title.textContent).toBe('차량 부품 정보');
    });

    it('displays loading state initially', () => {
        const element = createElement('c-vehicle-parts', {
            is: VehicleParts
        });
        document.body.appendChild(element);

        const loadingSpinner = element.shadowRoot.querySelector('lightning-spinner');
        expect(loadingSpinner).toBeTruthy();
    });

    it('processes parts data correctly', () => {
        const element = createElement('c-vehicle-parts', {
            is: VehicleParts
        });
        document.body.appendChild(element);

        // Test the data processing method
        const processedData = element.processPartsData(mockPartsData);
        
        expect(processedData).toHaveLength(2);
        expect(processedData[0].stockRateFormatted).toBe(95);
        expect(processedData[1].stockRateFormatted).toBe(78);
    });

    it('generates correct gauge styles', () => {
        const element = createElement('c-vehicle-parts', {
            is: VehicleParts
        });
        document.body.appendChild(element);

        // Test gauge style generation
        const highStockStyle = element.getGaugeStyle(95);
        const lowStockStyle = element.getGaugeStyle(15);
        
        expect(highStockStyle).toContain('width: 95%');
        expect(highStockStyle).toContain('#4CAF50'); // Green color for high stock
        
        expect(lowStockStyle).toContain('width: 15%');
        expect(lowStockStyle).toContain('#F44336'); // Red color for low stock
    });

    it('formats price correctly', () => {
        const element = createElement('c-vehicle-parts', {
            is: VehicleParts
        });
        document.body.appendChild(element);

        const formattedPrice = element.formatPrice(150000);
        expect(formattedPrice).toBe('150,000');
    });

    it('handles empty or null price', () => {
        const element = createElement('c-vehicle-parts', {
            is: VehicleParts
        });
        document.body.appendChild(element);

        expect(element.formatPrice(null)).toBe('0');
        expect(element.formatPrice(undefined)).toBe('0');
        expect(element.formatPrice(0)).toBe('0');
    });
});