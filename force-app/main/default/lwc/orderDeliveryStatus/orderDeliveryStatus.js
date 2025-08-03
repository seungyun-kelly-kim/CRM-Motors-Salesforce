import { LightningElement, api, track } from "lwc";
import getOrderDeliveryStatus from "@salesforce/apex/OrderDeliveryController.getOrderDeliveryStatus";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class OrderDeliveryStatus extends LightningElement {
  @api recordId;
  @track orderData = {};
  @track isLoading = true;
  @track error;

  // 배송 상태 단계 정의
  statusSteps = [
    {
      key: "InPreparation",
      label: "주문 준비 중",
      icon: "utility:package",
      description: "주문이 접수되어 준비 중입니다"
    },
    {
      key: "Delivering",
      label: "배송중",
      icon: "utility:truck",
      description: "상품이 배송 중입니다"
    },
    {
      key: "Delivered",
      label: "배송 완료",
      icon: "utility:success",
      description: "배송이 완료되었습니다"
    }
  ];

  connectedCallback() {
    this.loadOrderData();
    // 자동 새로고침 비활성화 - 필요시 주석 해제
    // this.refreshInterval = setInterval(() => {
    //     this.loadOrderData();
    // }, 5000);
  }

  disconnectedCallback() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadOrderData() {
    if (!this.recordId) return;

    this.isLoading = true;
    getOrderDeliveryStatus({ orderId: this.recordId })
      .then((data) => {
        console.log("🔍 새로운 데이터 받음:", data);
        console.log("🔍 Status 값:", data.Status);
        this.orderData = data;
        this.error = undefined;
        this.isLoading = false;
      })
      .catch((error) => {
        console.log("🔍 에러:", error);
        this.error = error;
        this.orderData = {};
        this.isLoading = false;
        this.showErrorToast("주문 정보를 가져오는 중 오류가 발생했습니다.");
      });
  }

  get currentStatus() {
    const status = this.orderData.Status;

    console.log("🔍 Debug - 전체 orderData:", this.orderData);
    console.log("🔍 Debug - Status:", status);

    // undefined이면 기본값 설정
    if (!status) {
      console.log("🔍 Status가 undefined이므로 InPreparation으로 설정");
      return "InPreparation";
    }

    // Status API name 매핑
    switch (status) {
      case "Draft":
        return "InPreparation"; // 주문 준비중
      case "Activated":
        return "Delivering"; // 배송중
      case "Delivered":
        return "Delivered"; // 배송 완료
      case "Cancelled":
        return "Cancelled"; // 주문 취소
      default:
        console.log("🔍 매핑되지 않은 상태값:", status);
        return "InPreparation"; // 기본값
    }
  }

  get isCancelled() {
    return this.currentStatus === "Cancelled";
  }

  get processedSteps() {
    const currentStatus = this.currentStatus;

    if (this.isCancelled) {
      return this.statusSteps.map((step) => ({
        ...step,
        isActive: false,
        isCompleted: false,
        isCancelled: true,
        stepClass: "step pending",
        stepIconClass: "step-icon-container pending"
      }));
    }

    const currentIndex = this.statusSteps.findIndex(
      (step) => step.key === currentStatus
    );

    return this.statusSteps.map((step, index) => {
      const isActive = index === currentIndex;
      const isCompleted = index < currentIndex;
      const isLast = index === this.statusSteps.length - 1;

      let stepIconClass = "step-icon-horizontal";
      let stepLabelClass = "step-label-horizontal";
      let connectorClass = "step-connector";

      if (isCompleted) {
        stepIconClass += " completed";
        stepLabelClass += " completed";
        connectorClass += " completed";
      } else if (isActive) {
        stepIconClass += " active";
        stepLabelClass += " active";
        connectorClass += " active";
      } else {
        stepIconClass += " pending";
        stepLabelClass += " pending";
        connectorClass += " pending";
      }

      return {
        ...step,
        isActive,
        isCompleted,
        isLast,
        isCancelled: false,
        stepIconClass,
        stepLabelClass,
        connectorClass
      };
    });
  }

  get progressBarStyle() {
    return `width: ${this.progressPercentage}%`;
  }

  get progressPercentage() {
    console.log("🔍 Debug - currentStatus:", this.currentStatus);
    console.log("🔍 Debug - orderData.Status:", this.orderData.Status);

    if (this.isCancelled) return 0;

    const currentIndex = this.statusSteps.findIndex(
      (step) => step.key === this.currentStatus
    );
    console.log("🔍 Debug - currentIndex:", currentIndex);

    if (currentIndex === -1) return 0;

    const percentage = ((currentIndex + 1) / this.statusSteps.length) * 100;
    console.log("🔍 Debug - percentage:", percentage);

    return Math.round(percentage * 10) / 10; // 소수점 첫째 자리까지 반올림
  }

  get statusMessage() {
    if (this.isCancelled) {
      return "주문이 취소되었습니다";
    }

    const currentStep = this.statusSteps.find(
      (step) => step.key === this.currentStatus
    );
    return currentStep
      ? currentStep.description
      : `현재 상태: ${this.currentStatus || "정보 없음"}`;
  }

  get orderInfo() {
    return {
      orderNumber: this.orderData.OrderNumber || "",
      orderName: this.orderData.Name || "",
      createdDate: this.orderData.CreatedDate || "",
      deliveryDate: this.orderData.Delivery_Date__c || ""
    };
  }

  showErrorToast(message) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: "오류",
        message: message,
        variant: "error"
      })
    );
  }
}
