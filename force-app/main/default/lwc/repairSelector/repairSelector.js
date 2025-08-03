// ✅ 파일명: repairSelector.js
import { LightningElement, track, wire } from 'lwc';
import getInspectionTypePicklistValues from '@salesforce/apex/RepairSelectorController.getInspectionTypePicklistValues';
import getServiceTypePicklistValues from '@salesforce/apex/RepairSelectorController.getServiceTypePicklistValues';
import getServiceDetailPicklistValues from '@salesforce/apex/RepairSelectorController.getServiceDetailPicklistValues';
import getDependentPicklistValues from '@salesforce/apex/RepairSelectorController.getDependentPicklistValues';

export default class RepairSelector extends LightningElement {
    @track selectedServiceTypeValue = '';
    @track selectedServiceType = '';
    @track selectedServiceTypeDetails = [];
    @track selectedServiceTypeDetailsString = '';
    @track description = '';
    @track inspectionTypePicklistOptions = [];
    @track serviceTypePicklistOptions = [];
    @track serviceDetailPicklistOptions = [];

    @wire(getInspectionTypePicklistValues)
    wiredInspectionTypeOptions({ error, data }) {
        if (data) {
            console.log('Inspection Type 피클리스트 데이터:', data);
            this.inspectionTypePicklistOptions = data;
        } else if (error) {
            console.error('Error fetching inspection type options:', error);
        }
    }

    @wire(getServiceTypePicklistValues)
    wiredServiceTypeOptions({ error, data }) {
        if (data) {
            console.log('Service Type 피클리스트 데이터:', data);
            this.serviceTypePicklistOptions = data;
        } else if (error) {
            console.error('Error fetching service type options:', error);
        }
    }

    // 초기 로드 시에는 빈 배열로 시작 (dependency 때문에)
    // @wire(getServiceDetailPicklistValues)
    // wiredServiceDetailOptions({ error, data }) {
    //     if (data) {
    //         console.log('Service Detail 피클리스트 데이터:', data);
    //         this.serviceDetailPicklistOptions = data;
    //     } else if (error) {
    //         console.error('Error fetching service detail options:', error);
    //     }
    // }

    get inspectionTypeOptions() {
        return this.inspectionTypePicklistOptions || [];
    }

    get serviceTypeOptions() {
        return this.serviceTypePicklistOptions || [];
    }

    get detailOptions() {
        // org의 모든 Service Detail 피클리스트 값을 반환
        return this.serviceDetailPicklistOptions || [];
    }

    get filteredDetailOptions() {
        // 동적으로 로드된 dependency options 사용
        return this.serviceDetailPicklistOptions.map(option => ({
            ...option,
            isSelected: this.selectedServiceTypeDetails.includes(option.value)
        }));
    }

    get hasSelectedDetails() {
        return this.selectedServiceTypeDetails.length > 0;
    }

    get selectedDetailsDisplay() {
        return this.selectedServiceTypeDetails.map(value => {
            const option = this.filteredDetailOptions.find(opt => opt.value === value);
            return option ? option.label : value;
        });
    }

    get isNextDisabled() {
        return !this.selectedServiceType || this.selectedServiceTypeDetails.length === 0;
    }

    handleServiceTypeValueChange(event) {
        this.selectedServiceTypeValue = event.detail.value;
        console.log('🔧 선택된 서비스 타입 값:', this.selectedServiceTypeValue);
    }

    handleServiceTypeChange(event) {
        this.selectedServiceType = event.detail.value;
        this.selectedServiceTypeDetails = []; // 기존 선택 초기화
        console.log('🔧 선택된 서비스 타입:', this.selectedServiceType);
        
        // 서비스 타입이 변경되면 세부 항목을 다시 로드
        this.loadDependentPicklistValues();
    }
    
    loadDependentPicklistValues() {
        if (this.selectedServiceType) {
            getDependentPicklistValues({ controllingValue: this.selectedServiceType })
                .then(result => {
                    this.serviceDetailPicklistOptions = result;
                    console.log('🔄 Dependent picklist values loaded:', result);
                })
                .catch(error => {
                    console.error('Error loading dependent picklist values:', error);
                });
        } else {
            this.serviceDetailPicklistOptions = [];
        }
    }

    handleDetailChange(event) {
        const value = event.target.dataset.value;
        const isChecked = event.target.checked;

        if (isChecked) {
            if (!this.selectedServiceTypeDetails.includes(value)) {
                this.selectedServiceTypeDetails = [...this.selectedServiceTypeDetails, value];
            }
        } else {
            this.selectedServiceTypeDetails = this.selectedServiceTypeDetails.filter(item => item !== value);
        }
        
        console.log('📋 현재 선택된 세부 항목들:', this.selectedServiceTypeDetails);
    }

    handleDescriptionChange(event) {
        this.description = event.detail.value;
    }

    handlePrevious() {
        this.dispatchEvent(new CustomEvent('previous'));
    }

    // ✅ Step 전환 기능 - 핵심!
    handleNext() {
        console.log('🚀 STEP 3 → 4 이동');
        console.log('선택된 점검 유형:', this.selectedServiceTypeValue);
        console.log('선택된 서비스 타입:', this.selectedServiceType);
        console.log('선택된 세부 항목들:', this.selectedServiceTypeDetails);

        const serviceReservationData = {
            Service_Type__c: this.selectedServiceTypeValue,
            ServiceReservationType__c: this.selectedServiceType,
            ServiceReservationTypeDetails__c: this.selectedServiceTypeDetails.join(';'),
            Description__c: this.description
        };

        // ✅ 부모 컴포넌트로 데이터 전달하여 다음 단계로 이동
        this.dispatchEvent(new CustomEvent('nextstep', {
            detail: {
                serviceReservationData,
                step: 4
            }
        }));
    }

    connectedCallback() {
        this.initializeData();
    }

    initializeData() {
        console.log('RepairSelector initialized');
    }

    getFormData() {
        return {
            ServiceReservationType__c: this.selectedServiceType,
            ServiceReservationTypeDetails__c: this.selectedServiceTypeDetails.join(';'),
            Description__c: this.description
        };
    }

    validateForm() {
        const isValid = this.selectedServiceType && this.selectedServiceTypeDetails.length > 0;
        if (!isValid) {
            console.warn('서비스 신청 유형과 세부 유형을 모두 선택해주세요.');
        }
        return isValid;
    }
}