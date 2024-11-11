define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojlistdataproviderview","ojs/ojdataprovider", 
    "ojs/ojconverterutils-i18n",
    "ojs/ojbutton", "ojs/ojtable", "ojs/ojinputtext", "ojs/ojselectsingle", "ojs/ojdialog", "ojs/ojvalidationgroup", "ojs/ojformlayout", 
    "ojs/ojinputtext", "ojs/ojprogress-circle", "ojs/ojselectcombobox", "ojs/ojdatetimepicker", "ojs/ojinputnumber","ojs/ojpopup",], 
    function (oj,ko,$, app, ArrayDataProvider, ListDataProviderView, ojdataprovider_1, ojconverterutils_i18n_1) {

        class RefferalList {
            constructor(args) {
                var self = this;
                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL");

                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        app.onAppSuccess();
                    }
                }

                self.filter = ko.observable('');

                self.refferalData = ko.observableArray([]);
                self.refferalCount = ko.observable();

                self.getRefferals= ()=>{
                    self.refferalData([]);
                    $.ajax({
                        url: BaseURL+"/getRefferralDetails",
                        type: 'GET',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                let len = data.length;
                                self.refferalCount(len)
                                for(let i=0;i<len;i++){
                                    self.refferalData.push({
                                        id: data[i].id,
                                        refferralId: data[i].unique_id,
                                        refferalType: data[i].refferal_type,
                                        name: data[i].name,
                                        phone: data[i].phone,
                                        email: data[i].email,
                                        students: data[i].students
                                    })
                                }
                            }
                            else{
                                self.refferalCount(0)
                            }
                        }
                    })
                }
                self.getRefferals();

                self.refferalDataProvider = ko.computed(function () {
                    let filterCriterion = null;
                    if (this.filter() && this.filter() != '') {
                        filterCriterion = ojdataprovider_1.FilterFactory.getFilter({
                            filterDef: { text: this.filter() }
                        });
                    }
                    const arrayDataProvider = new ArrayDataProvider(self.refferalData, { keyAttributes: 'Id' });
                    return new ListDataProviderView(arrayDataProvider, { filterCriterion: filterCriterion });
                }, self);
                self.handleValueChanged = () => {
                    self.filter(document.getElementById('filter').rawValue);
                };

                self.statuses = [
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' },
                ];
                self.statusList = new ArrayDataProvider(self.statuses, {
                    keyAttributes: 'value'
                });

                self.editIndividualId = ko.observable('');
                self.editName = ko.observable('');
                self.editSurname = ko.observable('');
                self.editIndividualEmail = ko.observable('');
                self.editIndividualEmailError = ko.observable('');
                self.editIndividualPhone = ko.observable('');
                self.editIndividualPhoneError = ko.observable('');
                self.editIndividualStatus = ko.observable('');

                self.editCompnayId = ko.observable('');
                self.editCompnayName = ko.observable('');
                self.editCompnayURL = ko.observable('');
                self.editCompanyURLError = ko.observable('');
                self.editCompanyPhone = ko.observable('');
                self.editCompanyPhoneError = ko.observable('');
                self.editCompanyEmail = ko.observable('');
                self.editCompanyEmailError = ko.observable('');
                self.editCompanyAddress = ko.observable();
                self.editCompanyStatus = ko.observable();

                self.editReferral = (event, row)=>{
                    let userId = row.data.id;
                    let refferalType = row.data.refferalType;

                    let url = "/getBusinessUser";
                    if(refferalType=="Individual"){
                        url = "/getIndividualUser";
                    }
                    $.ajax({
                        url: BaseURL+url,
                        type: 'POST',
                        data: JSON.stringify({
                            userId: userId
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                if(refferalType=="Individual"){
                                    self.editIndividualId(data[0].id)
                                    self.editName(data[0].name);
                                    self.editSurname(data[0].surname);
                                    self.editIndividualEmail(data[0].email);
                                    self.emailPatternValidator(data[0].email);
                                    self.editIndividualPhone(data[0].phone);
                                    self.editIndividualStatus(data[0].status)
                                    let popup = document.getElementById("editIndividualReferral");
                                    popup.open();
                                }
                                else{
                                    self.editCompnayId(data[0].id);
                                    self.editCompnayName(data[0].name);
                                    self.editCompnayURL(data[0].url);
                                    self.editCompanyPhone(data[0].phone);
                                    self.editCompanyEmail(data[0].email);
                                    self.emailPatternValidator(data[0].email);
                                    self.editCompanyAddress(data[0].address);
                                    self.editCompanyStatus(data[0].status);
                                    let popup = document.getElementById("editBusinessReferral");
                                    popup.open();
                                }
                            }
                        }
                    })
                }

                self.cancelIndividualEditReferralPopup = ()=>{
                    let popup = document.getElementById("editIndividualReferral");
                    popup.close();
                }

                self.cancelBusinessEditReferralPopup = ()=>{
                    let popup = document.getElementById("editBusinessReferral");
                    popup.close();
                }

                self.emailPatternValidator = (email)=>{
                    var mailformat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;                   
                    if(email==""){
                        return true;
                    }

                    if(typeof email === 'string'){
                        if(mailformat.test(email)){
                            self.editIndividualEmailError('')
                        }
                        else{
                            self.editIndividualEmailError("Should enter a valid email address.");
                        }
                        return mailformat.test(email);
                    }
                    else{
                        return true;
                    }
                    
                }

                self.validatePhoneNumber = (phone)=> {
                    const phoneNumber = /^[6-9]\d{9}$/;
                    if(phoneNumber.test(phone)){
                        self.editIndividualPhoneError('')
                    }
                    else{
                        self.editIndividualPhoneError("Should enter a valid Phone number");
                    }
                    return phoneNumber.test(phone);
                }

                self.validateURL = (url)=> {
                    const regex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
                    if(regex.test(url)){
                        self.editCompanyURLError('')
                    }
                    else{
                        self.editCompanyURLError("Should enter a valid URL");
                    }
                    return regex.test(url);
                }

                self.closeMessagePopup = ()=>{
                    let modalPopup = document.getElementById('messagePopup');
                    modalPopup.close();
                    self.cancelIndividualEditReferralPopup();
                    self.cancelBusinessEditReferralPopup();
                    self.getRefferals();
                }

                self.updateIndividulaRefferal=()=>{
                    let userId = self.editIndividualId();
                    const formValid = self._checkValidationGroup("individualEdit");
                    if(formValid){
                        if(self.emailPatternValidator(self.editCompanyEmail()) && self.validatePhoneNumber(self.editIndividualPhone())){
                            let progressPopup = document.getElementById("progress");
                            progressPopup.open();
                            $.ajax({
                                url: BaseURL+"/updateIndividualRefferal",
                                type: 'POST',
                                data: JSON.stringify({
                                    userId: userId,
                                    name: self.editName(),
                                    surname: self.editSurname(),
                                    email: self.editIndividualEmail(),
                                    phone: self.editIndividualPhone(),
                                    status: self.editIndividualStatus()
                                }),
                                dataType: 'json',
                                error: function (xhr, textStatus, errorThrown) {
                                    console.log(textStatus);
                                },
                                success: function (data) {
                                    progressPopup.close();
                                    const messageElement = document.getElementById("submitMessage");
                                    messageElement.innerText = data[0].message;
                                    if(data[0].status=="Success"){
                                        messageElement.style.color="green";
                                    }
                                    else{
                                        messageElement.style.color="red";
                                    }
                                    let messagePopup = document.getElementById('messagePopup');
                                    messagePopup.open();
                                },
                                error: function (xhr, textStatus, errorThrown) {
                                    console.error(`Request failed: ${textStatus} - ${errorThrown}`);
                                    progressPopup.close();
                                    alert("An error occurred while updating the referral.");
                                }
                            })
                        }
                    }
                }

                self.updateBusinessRefferal=()=>{
                    let userId = self.editCompnayId();
                    const formValid = self._checkValidationGroup("businessEdit");
                    if(formValid){
                        if(self.emailPatternValidator(self.editCompanyEmail()) && self.validatePhoneNumber(self.editCompanyPhone()) && self.validateURL(self.editCompnayURL())){
                            let progressPopup = document.getElementById("progress");
                            progressPopup.open();
                            $.ajax({
                                url: BaseURL+"/updateBusinessRefferal",
                                type: 'POST',
                                data: JSON.stringify({
                                    userId: userId,
                                    name: self.editCompnayName(),
                                    url: self.editCompnayURL(),
                                    email: self.editCompanyEmail(),
                                    phone: self.editCompanyPhone(),
                                    address: self.editCompanyAddress(),
                                    status: self.editCompanyStatus()
                                }),
                                dataType: 'json',
                                error: function (xhr, textStatus, errorThrown) {
                                    console.log(textStatus);
                                },
                                success: function (data) {
                                    progressPopup.close();
                                    const messageElement = document.getElementById("submitMessage");
                                    messageElement.innerText = data[0].message;
                                    if(data[0].status=="Success"){
                                        messageElement.style.color="green";
                                    }
                                    else{
                                        messageElement.style.color="red";
                                    }
                                    let messagePopup = document.getElementById('messagePopup');
                                    messagePopup.open();
                                },
                                error: function (xhr, textStatus, errorThrown) {
                                    console.error(`Request failed: ${textStatus} - ${errorThrown}`);
                                    progressPopup.close();
                                    alert("An error occurred while updating the referral.");
                                }
                            })
                        }
                    }
                }

                self._checkValidationGroup = (value) => {
                    const tracker = document.getElementById(value);
                    if (tracker.valid === "valid") {
                        return true;
                    }
                    else {
                        tracker.showMessages();
                        tracker.focusOn("@firstInvalidShown");
                        return false;
                    }
                };

            }
        }
        return  RefferalList;
    }
);