define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojlistdataproviderview","ojs/ojdataprovider", 
    "ojs/ojconverterutils-i18n",
    "ojs/ojbutton", "ojs/ojtable", "ojs/ojinputtext", "ojs/ojselectsingle", "ojs/ojdialog", "ojs/ojvalidationgroup", "ojs/ojformlayout", 
    "ojs/ojinputtext", "ojs/ojprogress-circle", "ojs/ojselectcombobox", "ojs/ojdatetimepicker", "ojs/ojinputnumber"], 
    function (oj,ko,$, app, ArrayDataProvider, ListDataProviderView, ojdataprovider_1, ojconverterutils_i18n_1) {

        class InstitutionList {
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

                self.institutionData = ko.observableArray([]);
                self.institutionCount = ko.observable();

                self.getInstitution = ()=>{
                    self.institutionData([]);
                    $.ajax({
                        url: BaseURL+"/getInstitution",
                        type: 'GET',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.institutionCount(len)
                                for(let i=0;i<len;i++){
                                    self.institutionData.push({
                                        institutionId: data[i][0],
                                        institutionName: data[i][1],
                                        institutionType: data[i][2],
                                        terittory: data[i][6],
                                        commissionRate: data[i][7],
                                        bonus: data[i][8],
                                        applicationMethod: data[i][9],
                                        agentPortal: data[i][10],
                                        restrictionNotes: data[i][12]
                                    })
                                }
                            }
                            else{
                                self.institutionCount(0)
                            }
                        }
                    })
                }
                self.getInstitution();

                self.institutionDataProvider = ko.computed(function () {
                    let filterCriterion = null;
                    if (this.filter() && this.filter() != '') {
                        filterCriterion = ojdataprovider_1.FilterFactory.getFilter({
                            filterDef: { text: this.filter() }
                        });
                    }
                    const arrayDataProvider = new ArrayDataProvider(this.institutionData, { keyAttributes: 'DepartmentId' });
                    return new ListDataProviderView(arrayDataProvider, { filterCriterion: filterCriterion });
                }, self);
                self.handleValueChanged = () => {
                    self.filter(document.getElementById('filter').rawValue);
                };

                self.addInstitute = ()=>{
                    document.getElementById("addInstitute").open();
                }
                self.cancelAddInstitutePopup = ()=>{
                    document.getElementById("addInstitute").close();
                }

                self.institutionTypes = [
                    { value: 'College', label: 'College' },
                    { value: 'University', label: 'Universities' },
                    { value: 'Pathways', label: 'Pathways'}
                ];
                self.institutionTypeSet = new ArrayDataProvider(self.institutionTypes, {
                    keyAttributes: 'value'
                });

                self.countries = ko.observableArray()
                self.countries.push(
                    {value: 'Afghanistan', label: 'Afghanistan'},
                    {value: 'Aland Islands', label: 'Aland Islands'} ,
                    {value: 'Albania', label: 'Albania'} ,
                    {value: 'Algeria', label: 'Algeria'} ,
                    {value: 'American Samoa', label: 'American Samoa'} ,
                    {value: 'Andorra', label: 'Andorra'} ,
                    {value: 'Angola', label: 'Angola'} ,
                    {value: 'Anguilla', label: 'Anguilla'} ,
                    {value: 'Antarctica', label: 'Antarctica'} ,
                    {value: 'Antigua and Barbuda', label: 'Antigua and Barbuda'},
                    {value: 'Argentina', label: 'Argentina'},
                    {value: 'Armenia', label: 'Armenia'},
                    {value: 'Aruba', label: 'Aruba'},
                    {value: 'Australia', label: 'Australia'},
                    {value: 'Austria', label: 'Austria'},
                    {value: 'Azerbaijan', label: 'Azerbaijan'},
                    {value: 'Bahamas', label: 'Bahamas'},
                    {value: 'Bahrain', label: 'Bahrain'},
                    {value: 'Bangladesh', label: 'Bangladesh'},
                    {value: 'Barbados', label: 'Barbados'},
                    {value: 'Belarus', label: 'Belarus'},
                    {value: 'Belgium', label: 'Belgium'},
                    {value: 'Belize', label: 'Belize'},
                    {value: 'Benin', label: 'Benin'},
                    {value: 'Bermuda', label: 'Bermuda'},
                    {value: 'Bhutan', label: 'Bhutan'},
                    {value: 'Bolivia', label: 'Bolivia'},
                    {value: 'Bosnia and Herzegovina', label: 'Bosnia and Herzegovina'},
                    {value: 'Botswana', label: 'Botswana'},
                    {value: 'Bouvet Island', label: 'Bouvet Island'},
                    {value: 'Brazil', label: 'Brazil'},
                    {value: 'British Indian Ocean Territory', label: 'British Indian Ocean Territory'},
                    {value: 'Brunei Darussalam', label: 'Brunei Darussalam'},
                    {value: 'Bulgaria', label: 'Bulgaria'},
                    {value: 'Burkina Faso', label: 'Burkina Faso'},
                    {value: 'Burundi', label: 'Burundi'},
                    {value: 'Cambodia', label: 'Cambodia'},
                    {value: 'Cameroon', label: 'Cameroon'},
                    {value: 'Canada', label: 'Canada'},
                    {value: 'Cape Verde', label: 'Cape Verde'},
                    {value: 'Cayman Islands', label: 'Cayman Islands'},
                    {value: 'Central African Republic', label: 'Central African Republic'},
                    {value: 'Chad', label: 'Chad'},
                    {value: 'Chile', label: 'Chile'},
                    {value: 'China', label: 'China'},
                    {value: 'Christmas Island', label: 'Christmas Island'},
                    {value: 'Cocos (Keeling) Islands', label: 'Cocos (Keeling) Islands'},
                    {value: 'Colombia', label: 'Colombia'},
                    {value: 'Comoros', label: 'Comoros'},
                    {value: 'Congo', label: 'Congo'},
                    {value: 'Congo, The Democratic Republic of The', label: 'Congo, The Democratic Republic of The'},
                    {value: 'Cook Islands', label: 'Cook Islands'},
                    {value: 'Costa Rica', label: 'Costa Rica'},
                    {value: "Cote D'ivoire", label: "Cote D'ivoire"},
                    {value: 'Croatia', label: 'Croatia'},
                    {value: 'Cuba', label: 'Cuba'},
                    {value: 'Cyprus', label: 'Cyprus'},
                    {value: 'Czech Republic', label: 'Czech Republic'},
                    {value: 'Denmark', label: 'Denmark'},
                    {value: 'Djibouti', label: 'Djibouti'},
                    {value: 'Dominica', label: 'Dominica'},
                    {value: 'Dominican Republic', label: 'Dominican Republic'},
                    {value: 'Ecuador', label: 'Ecuador'},
                    {value: 'Egypt', label: 'Egypt'},
                    {value: 'El Salvador', label: 'El Salvador'},
                    {value: 'Equatorial Guinea', label: 'Equatorial Guinea'},
                    {value: 'Eritrea', label: 'Eritrea'},
                    {value: 'Estonia', label: 'Estonia'},
                    {value: 'Ethiopia', label: 'Ethiopia'},
                    {value: 'Falkland Islands (Malvinas)', label: 'Falkland Islands (Malvinas)'},
                    {value: 'Faroe Islands', label: 'Faroe Islands'},
                    {value: 'Fiji', label: 'Fiji'},
                    {value: 'Finland', label: 'Finland'},
                    {value: 'France', label: 'France'},
                    {value: 'French Guiana', label: 'French Guiana'},
                    {value: 'French Polynesia', label: 'French Polynesia'},
                    {value: 'French Southern Territories', label: 'French Southern Territories'},
                    {value: 'Gabon', label: 'Gabon'},
                    {value: 'Gambia', label: 'Gambia'},
                    {value: 'Georgia', label: 'Georgia'},
                    {value: 'Germany', label: 'Germany'},
                    {value: 'Ghana', label: 'Ghana'},
                    {value: 'Gibraltar', label: 'Gibraltar'},
                    {value: 'Greece', label: 'Greece'},
                    {value: 'Greenland', label: 'Greenland'},
                    {value: 'Grenada', label: 'Grenada'},
                    {value: 'Guadeloupe', label: 'Guadeloupe'},
                    {value: 'Guam', label: 'Guam'},
                    {value: 'Guatemala', label: 'Guatemala'},
                    {value: 'Guernsey', label: 'Guernsey'},
                    {value: 'Guinea', label: 'Guinea'},
                    {value: 'Guinea-bissau', label: 'Guinea-bissau'},
                    {value: 'Guyana', label: 'Guyana'},
                    {value: 'Haiti', label: 'Haiti'},
                    {value: 'Heard Island and Mcdonald Islands', label: 'Heard Island and Mcdonald Islands'},
                    {value: 'Holy See (Vatican City State)', label: 'Holy See (Vatican City State)'},
                    {value: 'Honduras', label: 'Honduras'},
                    {value: 'Hong Kong', label: 'Hong Kong'},
                    {value: 'Hungary', label: 'Hungary'},
                    {value: 'Iceland', label: 'Iceland'},
                    {value: 'India', label: 'India'},
                    {value: 'Indonesia', label: 'Indonesia'},
                    {value: 'Iran, Islamic Republic of', label: 'Iran, Islamic Republic of'},
                    {value: 'Iraq', label: 'Iraq'},
                    {value: 'Ireland', label: 'Ireland'},
                    {value: 'Isle of Man', label: 'Isle of Man'},
                    {value: 'Israel', label: 'Israel'},
                    {value: 'Italy', label: 'Italy'},
                    {value: 'Jamaica', label: 'Jamaica'},
                    {value: 'Japan', label: 'Japan'},
                    {value: 'Jersey', label: 'Jersey'},
                    {value: 'Jordan', label: 'Jordan'},
                    {value: 'Kazakhstan', label: 'Kazakhstan'},
                    {value: 'Kenya', label: 'Kenya'},
                    {value: 'Kiribati', label: 'Kiribati'},
                    {value: "Korea, Democratic People's Republic of", label: "Korea, Democratic People's Republic of"},
                    {value: 'Korea, Republic of', label: 'Korea, Republic of'},
                    {value: 'Kuwait', label: 'Kuwait'},
                    {value: 'Kyrgyzstan', label: 'Kyrgyzstan'},
                    {value: "Lao People's Democratic Republic", label: "Lao People's Democratic Republic"},
                    {value: 'Latvia', label: 'Latvia'},
                    {value: 'Lebanon', label: 'Lebanon'},
                    {value: 'Lesotho', label: 'Lesotho'},
                    {value: 'Liberia', label: 'Liberia'},
                    {value: 'Libyan Arab Jamahiriya', label: 'Libyan Arab Jamahiriya'},
                    {value: 'Liechtenstein', label: 'Liechtenstein'},
                    {value: 'Lithuania', label: 'Lithuania'},
                    {value: 'Luxembourg', label: 'Luxembourg'},
                    {value: 'Macao', label: 'Macao'},
                    {value: 'Macedonia, The Former Yugoslav Republic of', label: 'Macedonia, The Former Yugoslav Republic of'},
                    {value: 'Madagascar', label: 'Madagascar'},
                    {value: 'Malawi', label: 'Malawi'},
                    {value: 'Malaysia', label: 'Malaysia'},
                    {value: 'Maldives', label: 'Maldives'},
                    {value: 'Mali', label: 'Mali'},
                    {value: 'Malta', label: 'Malta'},
                    {value: 'Marshall Islands', label: 'Marshall Islands'},
                    {value: 'Martinique', label: 'Martinique'},
                    {value: 'Mauritania', label: 'Mauritania'},
                    {value: 'Mauritius', label: 'Mauritius'},
                    {value: 'Mayotte', label: 'Mayotte'},
                    {value: 'Mexico', label: 'Mexico'},
                    {value: 'Micronesia, Federated States of', label: 'Micronesia, Federated States of'},
                    {value: 'Moldova, Republic of', label: 'Moldova, Republic of'},
                    {value: 'Monaco', label: 'Monaco'},
                    {value: 'Mongolia', label: 'Mongolia'},
                    {value: 'Montenegro', label: 'Montenegro'},
                    {value: 'Montserrat', label: 'Montserrat'},
                    {value: 'Morocco', label: 'Morocco'},
                    {value: 'Mozambique', label: 'Mozambique'},
                    {value: 'Myanmar', label: 'Myanmar'},
                    {value: 'Namibia', label: 'Namibia'},
                    {value: 'Nauru', label: 'Nauru'},
                    {value: 'Nepal', label: 'Nepal'},
                    {value: 'Netherlands', label: 'Netherlands'},
                    {value: 'Netherlands Antilles', label: 'Netherlands Antilles'},
                    {value: 'New Caledonia', label: 'New Caledonia'},
                    {value: 'New Zealand', label: 'New Zealand'},
                    {value: 'Nicaragua', label: 'Nicaragua'},
                    {value: 'Niger', label: 'Niger'},
                    {value: 'Nigeria', label: 'Nigeria'},
                    {value: 'Niue', label: 'Niue'},
                    {value: 'Norfolk Island', label: 'Norfolk Island'},
                    {value: 'Northern Mariana Islands', label: 'Northern Mariana Islands'},
                    {value: 'Norway', label: 'Norway'},
                    {value: 'Oman', label: 'Oman'},
                    {value: 'Pakistan', label: 'Pakistan'},
                    {value: 'Palau', label: 'Palau'},
                    {value: 'Palestinian Territory, Occupied', label: 'Palestinian Territory, Occupied'},
                    {value: 'Panama', label: 'Panama'},
                    {value: 'Papua New Guinea', label: 'Papua New Guinea'},
                    {value: 'Paraguay', label: 'Paraguay'},
                    {value: 'Peru', label: 'Peru'},
                    {value: 'Philippines', label: 'Philippines'},
                    {value: 'Pitcairn', label: 'Pitcairn'},
                    {value: 'Poland', label: 'Poland'},
                    {value: 'Portugal', label: 'Portugal'},
                    {value: 'Puerto Rico', label: 'Puerto Rico'},
                    {value: 'Qatar', label: 'Qatar'},
                    {value: 'Reunion', label: 'Reunion'},
                    {value: 'Romania', label: 'Romania'},
                    {value: 'Russian Federation', label: 'Russian Federation'},
                    {value: 'Rwanda', label: 'Rwanda'},
                    {value: 'Saint Helena', label: 'Saint Helena'},
                    {value: 'Saint Kitts and Nevis', label: 'Saint Kitts and Nevis'},
                    {value: 'Saint Lucia', label: 'Saint Lucia'},
                    {value: 'Saint Pierre and Miquelon', label: 'Saint Pierre and Miquelon'},
                    {value: 'Saint Vincent and The Grenadines', label: 'Saint Vincent and The Grenadines'},
                    {value: 'Samoa', label: 'Samoa'},
                    {value: 'San Marino', label: 'San Marino'},
                    {value: 'Sao Tome and Principe', label: 'Sao Tome and Principe'},
                    {value: 'Saudi Arabia', label: 'Saudi Arabia'},
                    {value: 'Senegal', label: 'Senegal'},
                    {value: 'Serbia', label: 'Serbia'},
                    {value: 'Seychelles', label: 'Seychelles'},
                    {value: 'Sierra Leone', label: 'Sierra Leone'},
                    {value: 'Singapore', label: 'Singapore'},
                    {value: 'Slovakia', label: 'Slovakia'},
                    {value: 'Slovenia', label: 'Slovenia'},
                    {value: 'Solomon Islands', label: 'Solomon Islands'},
                    {value: 'Somalia', label: 'Somalia'},
                    {value: 'South Africa', label: 'South Africa'},
                    {value: 'South Georgia and The South Sandwich Islands', label: 'South Georgia and The South Sandwich Islands'},
                    {value: 'Spain', label: 'Spain'},
                    {value: 'Sri Lanka', label: 'Sri Lanka'},
                    {value: 'Sudan', label: 'Sudan'},
                    {value: 'Suriname', label: 'Suriname'},
                    {value: 'Svalbard and Jan Mayen', label: 'Svalbard and Jan Mayen'},
                    {value: 'Swaziland', label: 'Swaziland'},
                    {value: 'Sweden', label: 'Sweden'},
                    {value: 'Switzerland', label: 'Switzerland'},
                    {value: 'Syrian Arab Republic', label: 'Syrian Arab Republic'},
                    {value: 'Taiwan', label: 'Taiwan'},
                    {value: 'Tajikistan', label: 'Tajikistan'},
                    {value: 'Tanzania, United Republic of', label: 'Tanzania, United Republic of'},
                    {value: 'Thailand', label: 'Thailand'},
                    {value: 'Timor-leste', label: 'Timor-leste'},
                    {value: 'Togo', label: 'Togo'},
                    {value: 'Tokelau', label: 'Tokelau'},
                    {value: 'Tonga', label: 'Tonga'},
                    {value: 'Trinidad and Tobago', label: 'Trinidad and Tobago'},
                    {value: 'Tunisia', label: 'Tunisia'},
                    {value: 'Turkey', label: 'Turkey'},
                    {value: 'Turkmenistan', label: 'Turkmenistan'},
                    {value: 'Turks and Caicos Islands', label: 'Turks and Caicos Islands'},
                    {value: 'Tuvalu', label: 'Tuvalu'},
                    {value: 'Uganda', label: 'Uganda'},
                    {value: 'Ukraine', label: 'Ukraine'},
                    {value: 'United Arab Emirates', label: 'United Arab Emirates'},
                    {value: 'United Kingdom', label: 'United Kingdom'},
                    {value: 'United States', label: 'United States'},
                    {value: 'United States Minor Outlying Islands', label: 'United States Minor Outlying Islands'},
                    {value: 'Uruguay', label: 'Uruguay'},
                    {value: 'Uzbekistan', label: 'Uzbekistan'},
                    {value: 'Vanuatu', label: 'Vanuatu'},
                    {value: 'Venezuela', label: 'Venezuela'},
                    {value: 'Viet Nam', label: 'Viet Nam'},
                    {value: 'Virgin Islands, British', label: 'Virgin Islands, British'},
                    {value: 'Virgin Islands, U.S.', label: 'Virgin Islands, U.S.'},
                    {value: 'Wallis and Futuna', label: 'Wallis and Futuna'},
                    {value: 'Western Sahara', label: 'Western Sahara'},
                    {value: 'Yemen', label: 'Yemen'},
                    {value: 'Zambia', label: 'Zambia'},
                    {value: 'Zimbabwe', label: 'Zimbabwe'}),
                self.countrySet = new ArrayDataProvider(self.countries, {
                    keyAttributes: 'value'
                });

                self.courseTypes = [
                    { value: 'Foundation', label: 'Foundation' },
                    { value: 'Undergraduate', label: 'Undergraduate' },
                    { value: 'Postgraduate', label: 'Postgraduate' },
                    { value: 'Pre-Masters', label: 'Pre-Masters' },
                    { value: 'Pre-Sessional', label: 'Pre-Sessional' },
                    { value: 'Phd', label: 'Phd' },
                    { value: 'Summer School', label: 'Summer School' },
                    { value: 'Pathways Follow on', label: 'Pathways Follow on' },
                    { value: 'Year 2 Follow on', label: 'Year 2 Follow on' },
                    { value: 'Year 3 Follow on', label: 'Year 3 Follow on' },
                ];
                self.courseTypeSet = new ArrayDataProvider(self.courseTypes, {
                    keyAttributes: 'value'
                });

                self.territories = [
                    { value: 'Nepal', label: 'Nepal' },
                    { value: 'India', label: 'India' },
                    { value: 'UAE', label: 'UAE' },
                    { value: 'Global', label: 'Global' },
                ];
                self.territorySet = new ArrayDataProvider(self.territories, {
                    keyAttributes: 'value'
                });

                self.institutionName = ko.observable('');
                self.institutionType = ko.observable('');
                self.email = ko.observable('');
                self.emailError = ko.observable('');
                self.invoiceEmail = ko.observable('');
                self.invoiceEmailError = ko.observable('');
                self.commissionable = ko.observable('');
                self.homePage = ko.observable('');
                self.urlError = ko.observable('');
                self.country = ko.observable('');
                self.territory = ko.observable('Nepal');
                self.commissionRate = ko.observable();

                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const day = currentDate.getDate();

                self.validFrom = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, month,day)));
                self.validUntil = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, month,day)));
                self.bonus = ko.observable('');
                self.applicationMethod = ko.observable('');
                self.agentPortal = ko.observable('');
                self.courseType = ko.observableArray([]);
                self.restrictionNotes = ko.observable('');

                self.emailPatternValidator = (email)=>{
                    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;                    
                    if(email==""){
                        return true;
                    }
                    if(email.match(mailformat)){
                        self.emailError('')
                    }
                    else{
                        self.emailError("Should enter a valid email address.");
                    }   
                    return email.match(mailformat);
                }

                self.submitInstitution = ()=>{
                    const formValid = self._checkValidationGroup("usersApplication");
                    if(formValid){
                        if(self.emailPatternValidator(self.email()) && self.emailPatternValidator(self.invoiceEmail())){
                            let courseType = self.courseType();
                            courseType = courseType.join(",");
                            let popup = document.getElementById("progress");
                            popup.open();
                            $.ajax({
                                url: BaseURL+"/addInstitution",
                                type: 'POST',
                                data: JSON.stringify({
                                    institutionName : self.institutionName(),
                                    institutionType : self.institutionType(),
                                    email : self.email(),
                                    invoiceMail : self.invoiceEmail(),
                                    homePage : self.homePage(),
                                    country : self.country(),
                                    territory : self.territory(),
                                    commissionRate : self.commissionRate(),
                                    validFrom : self.validFrom(),
                                    validUntil : self.validUntil(),
                                    bonus : self.bonus(),
                                    applicationMethod : self.applicationMethod(),
                                    agentPortalDetails : self.agentPortal(),
                                    courseType : courseType,
                                    restrictionNotes : self.restrictionNotes(),
                                    commissionable : self.commissionable()
                                }),
                                dataType: 'json',
                                timeout: sessionStorage.getItem("timeInetrval"),
                                context: self,
                                error: function (xhr, textStatus, errorThrown) {
                                    console.log(textStatus);
                                },
                                success: function (data) {
                                    location.reload()
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

                self.viewInstitution = (e)=>{
                    let institutionId = e.currentTarget.id;
                    sessionStorage.setItem("institutionId", institutionId);
                    window.location.href = `/?ojr=institutionProfile`;
                }
            }
        }
        return  InstitutionList;
    }
);