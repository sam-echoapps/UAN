define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojresponsiveutils", "ojs/ojresponsiveknockoututils",
    "ojs/ojinputtext", "ojs/ojformlayout", "ojs/ojselectsingle", "ojs/ojvalidationgroup", "ojs/ojpopup", "ojs/ojprogress-circle"], 
    function (oj,ko,$, app, ArrayDataProvider, responsiveUtils, responsiveKnockoutUtils) {

        class StudentRegister {
            constructor() {
                var self = this;

                let smQuery = responsiveUtils.getFrameworkQuery("sm-only");
                if (smQuery != null) {
                    self.isSmall = responsiveKnockoutUtils.createMediaQueryObservable(smQuery);
                }
                
                const urlParams = new URLSearchParams(window.location.search);
                let source = urlParams.get('utm_source');
                self.source = ko.observable(source)
                let medium = urlParams.get('utm_medium');
                self.medium = ko.observable(medium);
                let campaign = urlParams.get('utm_campaign');
                self.campaign = ko.observable(campaign)
                if(source==null){
                    source = ""
                    medium = ""
                    campaign = ""
                }
                
                self.labelEdge = ko.computed(() => {
                    return self.isSmall() ? "top" : "start";
                });
                
                self.firstName = ko.observable();
                self.lastName = ko.observable();
                self.mobileNumber = ko.observable();
                self.email = ko.observable();
                self.nearestOffice = ko.observable();
                self.intrestedCourse = ko.observable();
                self.formValid = ko.observable();
                self.phoneError = ko.observable();
                self.emailError = ko.observable();
                self.nationality = ko.observable('');
                self.studyAbroadDestination = ko.observable();

                self.abroadDestionations = [
                    {"label":"UK","value":"UK"},
                    {"label":"Canada","value":"Canada"},
                    {"label":"USA","value":"USA"},
                    {"label":"Ireland","value":"Ireland"}
                ]

                self.abroadDestionationsDp = new ArrayDataProvider(self.abroadDestionations, {
                    keyAttributes: 'value'
                });

                self.countryCode = ko.observable("+91");
                
                self.officeId = ko.observable();

                self.office = []
                self.getOffices = ()=>{
                    $.ajax({
                        url: "/getOffices",
                        type: 'GET',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                for(let i=0;i<len;i++){
                                    self.office.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                    if(data[i][1]=="Kathmandu"){
                                        self.officeId(data[i][0]);
                                    }
                                }
                            }
                        }
                    })
                }
                self.getOffices();
                
                self.officeDp = new ArrayDataProvider(self.office, {
                    keyAttributes: 'value'
                });

                self.yearIntaken = ko.observable()
                self.years = ko.observable();
                const currentYear = new Date().getFullYear();
                const years = [];
                for (let year = currentYear+2; year > currentYear; year--) {
                    years.push({ value: `${year}`, label: `${year}`})
                }
                self.years(years);
                self.yearsDp = new ArrayDataProvider(self.years(), {
                    keyAttributes: 'value'
                });

                self.phoneValidator = (event)=>{
                    var phone = event.detail.value
                    if (phone > 31 && (phone < 48 || phone > 57) && phone.length==10){
                        self.phoneError('')
                    }else{
                        self.phoneError("Invalid phone number.");
                    }
                }

                self.emailPatternValidator = (event)=>{
                    var email = event.detail.value
                    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                    if(email.match(mailformat))
                    {
                        self.emailError('')
                    }
                    else
                    {
                        self.emailError("Should enter a valid email address.");
                    }   
                }

                self.formSubmit = ()=>{
                    const formValid = self._checkValidationGroup("formValidation"); 
                    if (formValid) {
                        if(self.emailError()=='' && self.phoneError()==''){
                            let popup = document.getElementById("popup1");
                            popup.open();
                            $.ajax({
                                url: "/bookCounseling",
                                type: 'POST',
                                data: JSON.stringify({
                                    firstName : self.firstName(),
                                    lastName : self.lastName(),
                                    countryCode : self.countryCode(),
                                    phone : self.mobileNumber(),
                                    email : self.email(),
                                    year : self.yearIntaken(),
                                    officeId: self.officeId(),
                                    studyAbroadDestination: self.studyAbroadDestination(),
                                    utmSource: self.source(),
                                    utmMedium: self.medium(),
                                    utmCampaign: self.campaign()
                                }),
                                dataType: 'json',
                                timeout: sessionStorage.getItem("timeInetrval"),
                                context: self,
                                error: function (xhr, textStatus, errorThrown) {
                                    console.log(textStatus);
                                },
                                success: function (data) {
                                    let popup = document.getElementById("popup1");
                                    popup.close();
                                    let popup1 = document.getElementById("popup2");
                                    popup1.open();
                                }
                            })
                        }
                        else{
                            console.log("Error");
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

                self.cancelListener = ()=> {
                    location.reload();
                }
            }
        }
        return  StudentRegister;
    }
);