import { createElement } from '@lwc/engine-dom';
import TodayVisitReservations from 'c/todayVisitReservations';

describe('c-today-visit-reservations', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const element = createElement('c-today-visit-reservations', {
            is: TodayVisitReservations
        });
        document.body.appendChild(element);
        expect(element).toBeTruthy();
    });

    it('displays page title correctly', () => {
        const element = createElement('c-today-visit-reservations', {
            is: TodayVisitReservations
        });
        document.body.appendChild(element);

        const pageTitle = element.shadowRoot.querySelector('.page-title');
        expect(pageTitle).toBeTruthy();
        expect(pageTitle.textContent).toBe('오늘의 방문 예약');
    });

    it('shows loading spinner initially', () => {
        const element = createElement('c-today-visit-reservations', {
            is: TodayVisitReservations
        });
        document.body.appendChild(element);

        const spinner = element.shadowRoot.querySelector('lightning-spinner');
        expect(spinner).toBeTruthy();
    });

    it('displays refresh button', () => {
        const element = createElement('c-today-visit-reservations', {
            is: TodayVisitReservations
        });
        document.body.appendChild(element);

        const refreshButton = element.shadowRoot.querySelector('.refresh-button');
        expect(refreshButton).toBeTruthy();
    });

    it('shows no data message when no reservations', async () => {
        const element = createElement('c-today-visit-reservations', {
            is: TodayVisitReservations
        });
        
        // Mock empty reservations
        element.reservations = [];
        element.isLoading = false;
        
        document.body.appendChild(element);
        await Promise.resolve();

        const noDataMessage = element.shadowRoot.querySelector('.no-data-title');
        expect(noDataMessage).toBeTruthy();
        expect(noDataMessage.textContent).toBe('오늘 예약이 없습니다');
    });

    it('calculates reservation count correctly', () => {
        const element = createElement('c-today-visit-reservations', {
            is: TodayVisitReservations
        });
        
        // Test with no reservations
        element.reservations = [];
        expect(element.reservationCount).toBe(0);
        
        // Test with reservations
        element.reservations = [
            { Id: '1', CaseNumber: 'C-001' },
            { Id: '2', CaseNumber: 'C-002' }
        ];
        expect(element.reservationCount).toBe(2);
    });

    it('formats date and time correctly', () => {
        const element = createElement('c-today-visit-reservations', {
            is: TodayVisitReservations
        });
        document.body.appendChild(element);
        
        const testDateTime = '2024-07-28T14:30:00.000Z';
        const formattedTime = element.formatTime(testDateTime);
        const formattedDateTime = element.formatDateTime(testDateTime);
        
        expect(formattedTime).toBeTruthy();
        expect(formattedDateTime).toBeTruthy();
    });

    it('handles empty date gracefully', () => {
        const element = createElement('c-today-visit-reservations', {
            is: TodayVisitReservations
        });
        document.body.appendChild(element);
        
        expect(element.formatTime('')).toBe('');
        expect(element.formatDateTime('')).toBe('');
        expect(element.formatTime(null)).toBe('');
        expect(element.formatDateTime(null)).toBe('');
    });
});