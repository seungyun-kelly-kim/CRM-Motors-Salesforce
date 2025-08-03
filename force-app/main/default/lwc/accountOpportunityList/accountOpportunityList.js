import { LightningElement, api, wire } from 'lwc';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';

export default class AccountOpportunityList extends LightningElement {
    @api recordId;
    
    opportunities;
    error;

    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relatedListId: 'Opportunities',
        fields: [
            'Opportunity.Id',
            'Opportunity.Name',
            'Opportunity.StageName',
            'Opportunity.Amount',
            'Opportunity.CloseDate',
            'Opportunity.Probability',
            'Opportunity.LeadSource',
            'Opportunity.Type',
            'Opportunity.NextStep',
            'Opportunity.Sales_Person_InCharge__c'
        ]
    })
    wiredOpportunities({ error, data }) {
        if (data) {
            this.opportunities = data.records;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.opportunities = undefined;
        }
    }

    get hasOpportunities() {
        return this.opportunities && this.opportunities.length > 0;
    }

    get opportunityCount() {
        return this.opportunities ? this.opportunities.length : 0;
    }

    get formattedOpportunities() {
        if (!this.opportunities) return [];
        
        return this.opportunities.map(opportunity => {
            const fields = opportunity.fields;
            return {
                id: opportunity.id,
                name: fields.Name?.value || '기회명 없음',
                stageName: fields.StageName?.value || '단계 없음',
                amount: this.formatCurrency(fields.Amount?.value),
                closeDate: this.formatDate(fields.CloseDate?.value),
                probability: fields.Probability?.value ? `${fields.Probability.value}%` : '확률 없음',
                leadSource: fields.LeadSource?.value || '리드소스 없음',
                type: fields.Type?.value || '유형 없음',
                nextStep: fields.NextStep?.value || '다음단계 없음',
                salesPerson: fields.Sales_Person_InCharge__c?.displayValue || '담당자 없음',
                stageClass: this.getStageClass(fields.StageName?.value),
                probabilityClass: this.getProbabilityClass(fields.Probability?.value),
                isClosingSoon: this.isClosingSoon(fields.CloseDate?.value),
                isHighValue: this.isHighValue(fields.Amount?.value)
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

    getStageClass(stageName) {
        if (!stageName) return 'stage-unknown';
        
        const stage = stageName.toLowerCase();
        if (stage.includes('closed won') || stage.includes('성사')) {
            return 'stage-won';
        } else if (stage.includes('closed lost') || stage.includes('실패')) {
            return 'stage-lost';
        } else if (stage.includes('proposal') || stage.includes('제안')) {
            return 'stage-proposal';
        } else if (stage.includes('negotiation') || stage.includes('협상')) {
            return 'stage-negotiation';
        } else {
            return 'stage-active';
        }
    }

    getProbabilityClass(probability) {
        if (!probability) return 'probability-unknown';
        
        if (probability >= 80) return 'probability-high';
        if (probability >= 50) return 'probability-medium';
        if (probability >= 20) return 'probability-low';
        return 'probability-very-low';
    }

    isClosingSoon(closeDate) {
        if (!closeDate) return false;
        
        const today = new Date();
        const close = new Date(closeDate);
        const diffTime = close - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= 30 && diffDays >= 0;
    }

    isHighValue(amount) {
        return amount && amount >= 50000000; // 5천만원 이상
    }

    handleViewAll() {
        // Navigate to related list
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                relationshipApiName: 'Opportunities',
                actionName: 'view'
            }
        });
    }
}