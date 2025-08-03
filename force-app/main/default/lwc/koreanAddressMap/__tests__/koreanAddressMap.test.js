import { createElement } from '@lwc/engine-dom';
import KoreanAddressMap from 'c/koreanAddressMap';

describe('c-korean-address-map', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders the component', () => {
        const element = createElement('c-korean-address-map', {
            is: KoreanAddressMap
        });
        document.body.appendChild(element);
        
        const card = element.shadowRoot.querySelector('lightning-card');
        expect(card).toBeTruthy();
        expect(card.title).toBe('한국 주소 검색 및 지도');
    });

    it('shows address suggestions when typing', async () => {
        const element = createElement('c-korean-address-map', {
            is: KoreanAddressMap
        });
        document.body.appendChild(element);
        
        const input = element.shadowRoot.querySelector('lightning-input');
        input.value = '서울';
        input.dispatchEvent(new CustomEvent('input'));
        
        await Promise.resolve();
        
        expect(element.addressSuggestions.length).toBeGreaterThan(0);
    });
});