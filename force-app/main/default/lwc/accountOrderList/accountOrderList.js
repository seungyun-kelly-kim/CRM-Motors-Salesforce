import { LightningElement, api, wire } from 'lwc';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';

export default class AccountOrderList extends LightningElement {
    @api recordId;
    
    orders;
    error;

    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relatedListId: 'Orders',
        fields: [
            'Order.Id',
            'Order.OrderNumber',
            'Order.Name',
            'Order.Status',
            'Order.TotalAmount',
            'Order.EffectiveDate',
            'Order.Delivery_Date__c',
            'Order.Delivery_Status__c',
            'Order.VIN__c',
            'Order.Order_Channel__c'
        ]
    })
    wiredOrders({ error, data }) {
        if (data) {
            this.orders = data.records;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.orders = undefined;
        }
    }

    get hasOrders() {
        return this.orders && this.orders.length > 0;
    }

    get orderCount() {
        return this.orders ? this.orders.length : 0;
    }

    get formattedOrders() {
        if (!this.orders) return [];
        
        return this.orders.map(order => {
            const fields = order.fields;
            return {
                id: order.id,
                orderNumber: fields.OrderNumber?.value || '주문번호 없음',
                name: fields.Name?.value || '주문명 없음',
                status: fields.Status?.value || '상태 없음',
                totalAmount: this.formatCurrency(fields.TotalAmount?.value),
                effectiveDate: this.formatDate(fields.EffectiveDate?.value),
                deliveryDate: this.formatDate(fields.Delivery_Date__c?.value),
                deliveryStatus: fields.Delivery_Status__c?.value || '배송상태 없음',
                vin: fields.VIN__c?.value || 'VIN 없음',
                orderChannel: fields.Order_Channel__c?.value || '채널 없음',
                statusClass: this.getStatusClass(fields.Status?.value),
                deliveryStatusClass: this.getDeliveryStatusClass(fields.Delivery_Status__c?.value)
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
            default:
                return 'status-default';
        }
    }

    getDeliveryStatusClass(deliveryStatus) {
        if (!deliveryStatus) return 'delivery-unknown';
        
        switch (deliveryStatus.toLowerCase()) {
            case '배송완료':
            case 'delivered':
                return 'delivery-completed';
            case '배송중':
            case 'shipping':
                return 'delivery-shipping';
            case '준비중':
            case 'preparing':
                return 'delivery-preparing';
            default:
                return 'delivery-default';
        }
    }

    handleViewAll() {
        // Navigate to related list
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                relationshipApiName: 'Orders',
                actionName: 'view'
            }
        });
    }
}