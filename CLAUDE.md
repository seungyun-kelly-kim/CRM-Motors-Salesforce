# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Repair Service Reservation System** built on Salesforce Experience Cloud for Service using Lightning Web Components (LWC) and Apex. The system implements a 7-step reservation flow for automotive repair services with skill-based technician assignment.

## Common Development Commands

### Testing
```bash
# Run all unit tests
npm run test

# Run tests with coverage report
npm run test:unit:coverage

# Watch mode for continuous testing
npm run test:unit:watch

# Debug test mode
npm run test:unit:debug

# Run single test file
sfdx-lwc-jest force-app/main/default/lwc/componentName/__tests__/componentName.test.js
```

### Code Quality
```bash
# Run ESLint on LWC and Aura components
npm run lint

# Format code with Prettier
npm run prettier

# Verify Prettier formatting
npm run prettier:verify
```

### Salesforce DX Commands
```bash
# Create scratch org
sfdx org create scratch -f config/project-scratch-def.json -a ExpCloudService

# Push source to scratch org
sfdx project deploy start

# Pull changes from scratch org
sfdx project retrieve start
```

## Architecture Overview

### Multi-Step Reservation Flow
The core architecture is a **state machine** managed by the `reservationFlow` component:

1. **customerInfo** → Customer data retrieval
2. **customerAsset** → Vehicle asset selection  
3. **repairSelector** → Service type selection (controlling picklist)
4. **repairShopSelector** → Repair shop selection
5. **finalRepairReservation** → Date/time slot booking
6. **step6FinalConfirm** → Final confirmation
7. **Completion screen** → Success state

### Data Flow Pattern
- **Parent State Management**: `reservationFlow` maintains all flow state using `@track`
- **Event-Driven Communication**: Each step fires `nextstep` CustomEvent with data
- **Unidirectional Data Flow**: Parent passes data down via `@api` properties

### Backend Controllers
All Apex controllers follow consistent patterns:
- **Read Operations**: `@AuraEnabled(cacheable=true)` for queries
- **Write Operations**: `@AuraEnabled` for DML operations
- **Security**: All classes use `with sharing`
- **Error Handling**: `AuraHandledException` with user-friendly messages

## Key Data Model

### Custom Objects
- **`Repair_Shop__c`**: Shop locations with Province/City lookups
- **`OperatingHours__c`**: Shop operating schedules by day of week
- **`WorkingHour__c`**: Links technicians to operating hours (availability)
- **`TechnicianSkillset__c`**: Junction object mapping technicians to their skills
- **`Technician__c`**: Technician profiles linked to repair shops
- **`Parts__c`**: Vehicle parts catalog
- **Case**: Extended with reservation fields (`Repair_Shop__c`, `Preferred_Date__c`, `TechnicianPerCase__c`, etc.)

### Time Slot Logic
- **90-minute slots** with lunch break (13:00-14:30)
- **Skill-based technician assignment** using `TechnicianSkillset__c` junction object
- **Capacity-based scheduling** using technician availability
- **Real-time calculation** in `RepairReservationScheduler.getAvailableTimeSlots()`
- **Automatic technician assignment** via `assignTechnicianAndCreateCase()` based on required skills

### Skill Mapping System
The system uses intelligent skill-based assignment in `RepairReservationScheduler.getRequiredSkills()`:
- **엔진** (Engine): `engine_problem`, `noise_vibration`, `engine_oil_filter`
- **변속기** (Transmission): `transmission`, `transmission_oil`
- **전장(전기/전장품)** (Electrical): `fuse_lamp_battery`, `warning_lights`
- **소모품/경정비** (Consumables/Light Maintenance): `wiper_blades`, `air_conditioning_refrigerant`, `washer_fluid_coolant`, `other_consumables`
- **에어컨/HVAC**: `air_conditioning_refrigerant`

## Development Patterns

### LWC Component Structure
Every component follows this pattern:
```javascript
import { LightningElement, track, api } from 'lwc';

export default class ComponentName extends LightningElement {
    @track localState = {};
    @api parentData;
    
    handleNext() {
        // Validate data
        // Fire CustomEvent with data
        this.dispatchEvent(new CustomEvent('nextstep', {
            detail: { /* step data */ }
        }));
    }
}
```

### Error Handling Pattern
```javascript
// In LWC
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

handleError(error) {
    this.dispatchEvent(new ShowToastEvent({
        title: 'Error',
        message: error.body.message,
        variant: 'error'
    }));
}

// In Apex
try {
    // DML operation
} catch (DmlException e) {
    throw new AuraHandledException('User-friendly message: ' + e.getDmlMessage(0));
}
```

### Test Structure
All components have Jest test files. Current tests are placeholder stubs that need implementation:
```javascript
import { createElement } from '@lwc/engine-dom';
import ComponentName from 'c/componentName';

describe('c-component-name', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });
    // Implement actual tests here
});
```

## Important Notes

### Language Support
- UI includes Korean language strings (hardcoded)
- Consider using Custom Labels for proper internationalization

### Known Technical Debt
- **Hardcoded Account ID** in `CustomerInfoController.cls:4` - Currently uses fixed ID `001gL00000EKZzQQAX`
- **Missing Jest test implementations** - All test files are placeholder stubs that need implementation
- **Hardcoded Korean strings** - Should use Custom Labels for proper internationalization
- **Mixed language comments** - Korean and English comments throughout codebase

### Code Quality Tools
- **Husky** manages Git hooks
- **lint-staged** runs Prettier on commit
- **ESLint** configured for LWC/Aura best practices
- **Prettier** handles code formatting

## Project Configuration
- **API Version**: 64.0 (Winter '25)
- **Source Format**: Salesforce DX
- **Testing**: Jest with `@salesforce/sfdx-lwc-jest`
- **Package Directory**: `force-app/main/default/`
- **Pre-commit hooks**: Husky runs Prettier formatting on commit via lint-staged

## Validation Workflow
After making changes, always run:
```bash
npm run lint        # Check for ESLint errors
npm run prettier    # Format code
npm run test        # Run Jest tests
```

Note: There is no separate TypeScript compilation step as this is a pure JavaScript LWC project.