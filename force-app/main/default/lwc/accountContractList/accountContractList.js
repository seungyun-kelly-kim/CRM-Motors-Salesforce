import { LightningElement, api, wire } from 'lwc';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';

export default class AccountContractList extends LightningElement {
    @api recordId;
    
    contracts;
    error;

    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relatedListId: 'Contracts',
        fields: [
            'Contract.Id',
            'Contract.ContractNumber',
            'Contract.Name',
            'Contract.Status',
            'Contract.StartDate',
            'Contract.EndDate',
            'Contract.ContractTerm',
            'Contract.Field1__c',
            'Contract.Payment_Method__c',
            'Contract.Field2__c',
            'Contract.Insurance_Confirmed__c'
        ]
    })
    wiredContracts({ error, data }) {
        if (data) {
            this.contracts = data.records;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.contracts = undefined;
        }
    }

    get hasContracts() {
        return this.contracts && this.contracts.length > 0;
    }

    get contractCount() {
        return this.contracts ? this.contracts.length : 0;
    }

    get formattedContracts() {
        if (!this.contracts) return [];
        
        return this.contracts.map(contract => {
            const fields = contract.fields;
            return {
                id: contract.id,
                contractNumber: fields.ContractNumber?.value || '계약번호 없음',
                name: fields.Name?.value || '계약명 없음',
                status: fields.Status?.value || '상태 없음',
                startDate: this.formatDate(fields.StartDate?.value),
                endDate: this.formatDate(fields.EndDate?.value),
                contractTerm: fields.ContractTerm?.value ? `${fields.ContractTerm.value}개월` : '정보 없음',
                totalAmount: this.formatCurrency(fields.Field1__c?.value),
                paymentMethod: fields.Payment_Method__c?.value || '결제방식 없음',
                vehicleConfig: fields.Field2__c?.value || '구성정보 없음',
                insuranceConfirmed: fields.Insurance_Confirmed__c?.value ? '가입완료' : '미가입',
                statusClass: this.getStatusClass(fields.Status?.value),
                insuranceClass: this.getInsuranceClass(fields.Insurance_Confirmed__c?.value),
                isActive: this.isContractActive(fields.StartDate?.value, fields.EndDate?.value)
            };
        });
    }

    formatDate(dateValue) {
        if (!dateValue) return '정보 없음';
        return new Date(dateValue).toLocaleDateString('ko-KR');
    }

    formatCurrency(amount) {
        if (!amount) return '정보 없음';
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    }

    getStatusClass(status) {
        if (!status) return 'status-unknown';
        
        switch (status.toLowerCase()) {
            case 'activated':
            case '활성화':
                return 'status-active';
            case 'draft':
            case '초안':
                return 'status-draft';
            case 'expired':
            case '만료':
                return 'status-expired';
            default:
                return 'status-default';
        }
    }

    getInsuranceClass(insuranceConfirmed) {
        return insuranceConfirmed ? 'insurance-confirmed' : 'insurance-pending';
    }

    isContractActive(startDate, endDate) {
        if (!startDate || !endDate) return false;
        
        const today = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return today >= start && today <= end;
    }

    handleViewAll() {
        // Navigate to related list
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                relationshipApiName: 'Contracts',
                actionName: 'view'
            }
        });
    }
}