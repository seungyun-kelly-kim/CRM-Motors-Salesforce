import { LightningElement, api, track } from 'lwc';
import getAvailableTimeSlots from '@salesforce/apex/RepairReservationScheduler.getAvailableTimeSlots';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class FinalRepairReservation extends LightningElement {
    @api accountId;
    @api repairShopId;
    @api selectedServiceDetails;

    @track selectedDate = null;
    @track availableTimeSlots = [];
    @track selectedSlot = null;

    // 디버그: 모든 API 속성값 확인
    connectedCallback() {
        console.log('🔍 [finalRepairReservation] 컴포넌트 로드시 API 속성값 확인:');
        console.log('accountId:', this.accountId);
        console.log('repairShopId:', this.repairShopId);
        console.log('selectedServiceDetails:', this.selectedServiceDetails);
        console.log('selectedServiceDetails type:', typeof this.selectedServiceDetails);
        console.log('selectedServiceDetails length:', this.selectedServiceDetails ? this.selectedServiceDetails.length : 'N/A');
        console.log('selectedServiceDetails 값이 비어있나?:', !this.selectedServiceDetails);
        
        // 1초 후에도 다시 체크 (reactive 속성이 나중에 설정될 수 있음)
        setTimeout(() => {
            console.log('🔍 [finalRepairReservation] 1초 후 재확인:');
            console.log('selectedServiceDetails:', this.selectedServiceDetails);
            console.log('selectedServiceDetails type:', typeof this.selectedServiceDetails);
        }, 1000);
    }

    get hasSlots() {
        return this.availableTimeSlots.length > 0;
    }

    get todayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`; // KST 기준 YYYY-MM-DD 형식
    }

    handleDateChange(event) {
        const selectedDateValue = event.detail.value;
        
        // 날짜 유효성 검사 (KST 기준)
        const today = this.todayDate;
        if (selectedDateValue < today) {
            this.dispatchEvent(new ShowToastEvent({
                title: '선택할 수 없는 날짜입니다',
                message: '오늘 날짜 이후로 선택해주세요.',
                variant: 'error'
            }));
            // 잘못된 날짜는 설정하지 않음
            return;
        }
        
        this.selectedDate = selectedDateValue;
        this.selectedSlot = null;

        console.log('[예약 날짜 선택됨]', this.selectedDate);
        console.log('[repairShopId 확인]', this.repairShopId);

        if (this.selectedDate && this.repairShopId) {
            console.log('🔍 [finalRepairReservation] getAvailableTimeSlots 호출 직전:');
            console.log('selectedDate:', this.selectedDate);
            console.log('repairShopId:', this.repairShopId);
            console.log('selectedServiceDetails (전달할 값):', this.selectedServiceDetails);
            
            getAvailableTimeSlots({
                selectedDate: this.selectedDate,
                repairShopId: this.repairShopId,
                selectedDetails: this.selectedServiceDetails
            }).then(result => {
                console.log('[받아온 타임슬롯]', result);

                this.availableTimeSlots = result.map(slot => ({
                    ...slot,
                    fullLabel: slot.label,
                    variant: slot.remaining > 0 ? 'neutral' : 'destructive',
                    isDisabled: slot.remaining <= 0
                }));
            }).catch(error => {
                console.error('타임 슬롯 불러오기 오류:', error);
                this.availableTimeSlots = [];
            });
        } else {
            console.warn('조건 미충족: 날짜 또는 정비소 ID 누락');
        }
    }

    handleSlotSelect(event) {
        console.log('🎯 [디버그] handleSlotSelect 호출됨');
        this.selectedSlot = event.currentTarget.dataset.time;
        console.log('✅ [디버그] selectedSlot 설정됨:', this.selectedSlot);
    }

    get isNextDisabled() {
        return !this.selectedSlot;
    }

    handlePrevious() {
        this.dispatchEvent(new CustomEvent('previous'));
    }

    handleNext() {
        console.log('🚀 [디버그] handleNext 호출됨');
        
        // 모든 필수값 체크
        console.log('🔍 [디버그] 필수값 체크:');
        console.log('selectedSlot:', this.selectedSlot);
        console.log('selectedDate:', this.selectedDate);
        console.log('accountId:', this.accountId);
        console.log('repairShopId:', this.repairShopId);
        console.log('selectedServiceDetails:', this.selectedServiceDetails);

        if (!this.selectedSlot || !this.selectedDate || !this.accountId || !this.repairShopId || !this.selectedServiceDetails) {
            console.log('❌ [디버그] 조건문에서 막힘 - 필수값 누락');
            return;
        }

        console.log('✅ [디버그] 조건문 통과 - STEP 6로 직접 이동');

        // API 호출 없이 바로 다음 단계로 이동
        this.dispatchEvent(new CustomEvent('nextstep', { 
            detail: {
                step: 6,
                selectedDate: this.selectedDate,
                selectedSlotTime: this.selectedSlot
            } 
        }));
    }
}