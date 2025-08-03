import { LightningElement, api, track } from 'lwc';
import CarWithBattery from '@salesforce/resourceUrl/CarWithBattery';

export default class VehicleBatteryView extends LightningElement {
    @api recordId; // Account ID
    @track showBatteryTooltip = false;
    @track tooltipPosition = { x: 0, y: 0 };

    // 하드코딩된 배터리 정보
    batteryInfo = {
        type: 'Lithium-ion',
        capacity: '64 kWh',
        currentLevel: 85,
        health: 70,
        lastReplaced: '2023.03.15',
        nextMaintenance: '2024.09.15',
        serialNumber: 'BAT12345KWE',
        manufacturer: 'Samsung SDI',
        voltage: '400V',
        temperature: '23°C',
        chargingCycles: 1247
    };

    // CarWithBattery static resource URL
    get carImageUrl() {
        return CarWithBattery;
    }

    get batteryLevelStyle() {
        return `width: ${this.batteryInfo.currentLevel}%; background-color: ${this.getBatteryColor()};`;
    }

    get batteryHealthStyle() {
        return `width: ${this.batteryInfo.health}%; background-color: ${this.getBatteryHealthColor()};`;
    }
    
    getBatteryHealthColor() {
        const health = this.batteryInfo.health;
        if (health < 50) return '#F44336'; // 빨간색
        if (health < 80) return '#FFC107'; // 노란색
        return '#4CAF50'; // 녹색
    }

    getBatteryColor() {
        const level = this.batteryInfo.currentLevel;
        if (level < 20) return '#F44336'; // 빨간색
        if (level < 50) return '#FF9800'; // 주황색
        if (level < 80) return '#2196F3'; // 파란색
        return '#4CAF50'; // 녹색
    }

    handleMouseEnter(event) {
        const rect = event.target.getBoundingClientRect();
        this.tooltipPosition = {
            x: rect.left + rect.width / 2,
            y: rect.top - 10
        };
        this.showBatteryTooltip = true;
    }

    handleMouseLeave() {
        this.showBatteryTooltip = false;
    }

    handleMouseMove(event) {
        if (this.showBatteryTooltip) {
            this.tooltipPosition = {
                x: event.clientX,
                y: event.clientY - 10
            };
        }
    }

    get tooltipStyle() {
        // 툴팁을 마우스 우측에 표시 (좌측으로 오프셋 줄이고 우측으로 이동)
        return `left: ${this.tooltipPosition.x + 20}px; top: ${this.tooltipPosition.y - 320}px;`;
    }
}