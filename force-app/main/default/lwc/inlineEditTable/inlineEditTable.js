import { LightningElement, track, wire } from 'lwc';
import getAccounts from '@salesforce/apex/InlineEditTableController.getAccounts';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import RATING_FIELD from '@salesforce/schema/Account.Rating';
import ID_FIELD from '@salesforce/schema/Account.Id';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { deleteRecord, updateRecord  } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';

export default class InlineEditTable extends LightningElement {

    @track accountList = [];
    @track wiredAccountList = [];
    currentField = {};
    currentFieldOldValue;
    showButtons = false;

    @wire(getAccounts) 
    wiredAccounts(result) {
        console.log('result= ',result);
        this.wiredAccountList = result;
        if (result.data) {
            this.accountList = result.data;
        } else if (result.error) {
            this.accountList = undefined;
            const error = result.error;
            console.log('error= ',error);
        }
    }

    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    accountMetadata;

    @wire(getPicklistValues,
        {
            recordTypeId: '$accountMetadata.data.defaultRecordTypeId', 
            fieldApiName: RATING_FIELD
        }
    )
    ratingPicklist;

    deleteAccount(event) {
        const accountId = event.target.dataset.id;
        console.log('accountId= ',accountId);
        deleteRecord(accountId)
            .then(() => {
                this.showToastEvent('Success', 'success', 'This contact was successfully deleted!');
                refreshApex(this.wiredAccountList);
            })
            .catch(error => {
                console.log("Error deleting account => " + error.body.message);
                this.showToastEvent('Error', 'error', 'This contact was not successfully deleted!');
            })
    }

    editField(event) {
        
        this.template.querySelectorAll('button').forEach(button => {
            if (button.dataset.name != event.target.dataset.name || button.dataset.id != event.target.dataset.id) {
                button.disabled = true;
            }
        });
        const fieldName = event.target.dataset.name;
        const currentSelector = fieldName == 'accountName' ? `lightning-input[data-name=${fieldName}]` : '.combobox';
        this.currentField = Array.from(this.template.querySelectorAll(`${currentSelector}`))
            .find(element => element.dataset.id == event.target.dataset.id);
        if (fieldName == 'accountName') {
            this.currentFieldOldValue = this.currentField.value;
            this.currentField.readOnly = false;
        } else {
            this.currentField = this.currentField.children[0];
            this.currentFieldOldValue = this.currentField.value;
            this.currentField.parentNode.style.display = 'block';
            event.target.parentElement.children[0].style.display = 'none';
        }
        this.currentField.focus();
    }

    handleFieldChange(event) {
        if (event.target.dataset.name == 'accountName' && !event.target.value) {
            event.target.reportValidity();
            this.disabled = true;
        }
    }

    handleFieldBlur(event) {
        // console.log('this.currentFieldOldValue= ', this.currentFieldOldValue);
        // console.log('handleFieldBlur value= ', event.target.value);
        if (this.currentFieldOldValue !== event.target.value && this.currentFieldOldValue != undefined) {
            event.target.parentNode.parentNode.parentNode.classList.add('lgc-highlight');
            event.target.parentNode.parentNode.classList.add('lgc-highlight');
            event.target.parentNode.classList.add('lgc-highlight');
            event.target.classList.add('lgc-highlight');
            this.showButtons = true;
            this.currentField.value = event.target.value;
            console.log('this.currentField.value= ', this.currentField.value);
        } else {
            this.cancelEdition(false);
        }
    }

    cancel() {
        this.cancelEdition(true);
    }

    cancelEdition(isTrue) {

        this.showButtons = false;
        this.template.querySelectorAll('button').forEach(button => {
            button.disabled = false;
        });
        
        if (this.currentField.dataset.name == 'accountName') {
            this.currentField.readOnly = true;
           
        } else {
            this.currentField.parentNode.style.display = 'none';
            this.currentField.parentElement.parentElement.children[0].style.display = 'block';
        }
        this.currentField.parentNode.classList.remove('lgc-highlight');
        this.currentField.parentNode.parentNode.parentNode.classList.remove('lgc-highlight');
        this.currentField.parentNode.parentNode.classList.remove('lgc-highlight');
        this.currentField.parentNode.classList.remove('lgc-highlight');
        this.currentField.classList.remove('lgc-highlight');
        if (isTrue) {
            console.log('isTrue= ', isTrue);
            this.currentField.value = this.currentFieldOldValue;
            if (this.currentField.dataset.name == 'accountRating') {
                this.currentField.parentElement.parentElement.children[0].children[0].value = this.currentFieldOldValue;
            }
        } else {
            this.currentFieldOldValue = undefined;
        }

    }

    updateAccount() {
        console.log('this.currentField.dataset.name= ', this.currentField.dataset.name);
        console.log('this.currentField.value= ', this.currentField.value);
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.currentField.dataset.id;
        if (this.currentField.dataset.name == 'accountName') {
            const allValid = [...this.template.querySelectorAll('lightning-input')]
                .reduce((validSoFar, inputFields) => {
                    inputFields.reportValidity();
                    return validSoFar && inputFields.checkValidity();
                }, true);
            if (allValid) {
                fields[NAME_FIELD.fieldApiName] = this.currentField.value;
            } else {
                this.showToastEvent('Error', 'error', 'Check your input and try again.');
            }
        } else {
            fields[RATING_FIELD.fieldApiName] = this.currentField.value;
            this.currentField.parentElement.parentElement.children[0].children[0].value = this.currentField.value;
        }
        const recordInput = { fields };
        console.log('recordInput= ', recordInput);
        updateRecord(recordInput)
            .then(() => {
                this.showToastEvent('Success', 'success', 'Account updated');
                this.cancelEdition(false);
                return refreshApex(this.wiredAccountList);
            })
            .catch(error => {
                this.showToastEvent('Error updating Account', 'error', error);
                this.cancelEdition(true);
            });
    }

    showToastEvent(title, variant, message) {
        const event = new ShowToastEvent({
            title: title,
            variant: variant,
            message: message,
        });
        this.dispatchEvent(event);
    }
    
}