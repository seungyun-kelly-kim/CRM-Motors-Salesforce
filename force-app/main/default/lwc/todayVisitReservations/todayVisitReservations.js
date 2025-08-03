import { LightningElement, track, api } from 'lwc';
import getTodayVisitReservations from '@salesforce/apex/TodayVisitReservationController.getTodayVisitReservations';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TodayVisitReservations extends LightningElement {
    @track reservations = [];
    @track isLoading = true;
    @track error;

    connectedCallback() {
        this.loadReservations();
        // 5분마다 자동 새로고침
        this.refreshInterval = setInterval(() => {
            this.loadReservations();
        }, 300000);
    }

    disconnectedCallback() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    loadReservations() {
        this.isLoading = true;
        getTodayVisitReservations()
            .then(data => {
                console.log('🔍 받은 예약 데이터:', data);
                if (data && data.length > 0) {
                    console.log('🔍 첫 번째 예약 필드들:', Object.keys(data[0]));
                    console.log('🔍 ServiceReservationType__c 값:', data[0].ServiceReservationType__c);
                }
                this.reservations = data;
                this.error = undefined;
                this.isLoading = false;
            })
            .catch(error => {
                console.error('🔍 에러:', error);
                this.error = error;
                this.reservations = [];
                this.isLoading = false;
                this.showErrorToast('예약 정보를 가져오는 중 오류가 발생했습니다.');
            });
    }

    get hasReservations() {
        return this.reservations && this.reservations.length > 0;
    }

    get reservationCount() {
        return this.reservations ? this.reservations.length : 0;
    }

    get formattedReservations() {
        if (!this.reservations) return [];
        
        return this.reservations.map(reservation => ({
            ...reservation,
            formattedTime: this.formatTime(reservation.Preferred_Date__c),
            customerName: reservation.Contact?.Name || reservation.Account?.Name || '',
            phoneNumber: reservation.ContactPhone || reservation.ContactMobile || '',
            technicianName: reservation.TechnicianPerCase__r?.Name || '',
            serviceType: this.getServiceTypeLabel(reservation.ServiceReservationType__c),
            displayStatus: this.getDisplayStatus(reservation.Status),
            caseUrl: `/lightning/r/Case/${reservation.Id}/view`,
            statusClass: this.getStatusClass(reservation.Status)
        }));
    }

    getStatusClass(status) {
        // Working 상태만 조회되므로 모두 동일한 스타일 적용
        return 'status-working';
    }

    getDisplayStatus(status) {
        if (status === 'Working') {
            return '배정';
        }
        return status;
    }

    getServiceTypeLabel(serviceType) {
        if (!serviceType) return '';
        
        // 서비스 유형 API 값을 한국어 라벨로 매핑
        const serviceTypeLabels = {
            'engine_problem': '엔진 문제',
            'transmission': '변속기',
            'fuse_lamp_battery': '전장(전기/전장품)',
            'wiper_blades': '소모품/경정비',
            'air_conditioning_refrigerant': '에어컨/HVAC',
            'engine_oil_filter': '엔진 오일/필터',
            'transmission_oil': '변속기 오일',
            'warning_lights': '경고등',
            'noise_vibration': '소음/진동',
            'washer_fluid_coolant': '워셔액/냉각수',
            'other_consumables': '기타 소모품'
        };
        
        return serviceTypeLabels[serviceType] || serviceType;
    }

    handleRowClick(event) {
        const caseId = event.currentTarget.dataset.caseId;
        if (caseId) {
            window.open(`/lightning/r/Case/${caseId}/view`, '_blank');
        }
    }

    @api
    formatDateTime(dateTimeString) {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toLocaleString('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    @api
    formatTime(dateTimeString) {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    handleRefresh() {
        this.loadReservations();
    }

    showErrorToast(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: '오류',
                message: message,
                variant: 'error'
            })
        );
    }
}