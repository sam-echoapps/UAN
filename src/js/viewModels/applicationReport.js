define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojconverterutils-i18n", 
        "ojs/ojlistdataproviderview","ojs/ojdataprovider","ojs/ojdatetimepicker", "ojs/ojradioset", "ojs/ojselectcombobox",
        "ojs/ojselectsingle", "ojs/ojtable", "ojs/ojinputsearch", "ojs/ojpopup", "ojs/ojprogress-circle", "ojs/ojmenu"], 
    function (oj,ko,$, app, ArrayDataProvider, ojconverterutils_i18n_1, ListDataProviderView, ojdataprovider_1, PagingDataProviderView) {

        class ApplicationReport {
            constructor(args) {
                var self = this;
                
                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL")
                
                self.officeId = ko.observable();
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));

                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const day = currentDate.getDate();

                self.fromDate = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, 0, 1)));
                self.datePicker = {
                    numberOfMonths: 1
                };
                self.toDate = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, month,day)));
                
                self.selectRadio = ko.observable('CSD');

                if(self.userRole()=="admin" || self.userRole()=="director"){
                    self.officeId("")
                }
                else if(self.userRole()=="manager"){
                    self.officeId(sessionStorage.getItem("userOfficeId"));
                }
                else{
                    self.officeId(sessionStorage.getItem("userOfficeId"));
                }

                const currentYear = new Date().getFullYear();
                self.selectYear = ko.observable(currentYear.toString());

                if(sessionStorage.getItem("selectYear")==null || self.selectYear()==currentYear){
                    sessionStorage.setItem("selectYear", self.selectYear())
                }

                const years = [];
                let seYear = currentYear+2;
                
                for (let year = seYear; year >= 2022; year--) {
                    years.push({ value: `${year}`, label: `${year}`})
                }
                self.years = years;
                self.yearsDp = new ArrayDataProvider(self.years, {
                    keyAttributes: 'value'
                });
                
                self.data = ko.observableArray();
                self.totalApplicationCnt = ko.observable(0);
                self.course = ko.observable(["All"]);

                self.countries = ko.observableArray()
                self.countries.push(
                    {value: 'All', label: 'All'},
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

                self.country = ko.observable(["All"]);

                self.getCount = ()=>{
                    self.data([])
                    $.ajax({
                        url: BaseURL+"/getApplicationCountYear",
                        type: 'POST',
                        data: JSON.stringify({
                            year: self.selectYear(),
                            officeId: self.officeId()
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.data.push({
                                Year: `Current Year (${self.selectYear()})` ,
                                totalApplication: data[0][0][0],
                                foundation: data[0][0][1],
                                ug: data[0][0][2],
                                pg: data[0][0][3],
                                preMast: data[0][0][4],
                                preSess: data[0][0][5],
                                phd: data[0][0][6],
                                ss: data[0][0][7],
                                phfo: data[0][0][8],
                                y2: data[0][0][9],
                                y3: data[0][0][10],
                            });
                            self.data.push({
                                Year: `Prior Year (${self.selectYear()-1})` ,
                                totalApplication: data[1][0][0],
                                foundation: data[1][0][1],
                                ug: data[1][0][2],
                                pg: data[1][0][3],
                                preMast: data[1][0][4],
                                preSess: data[1][0][5],
                                phd: data[1][0][6],
                                ss: data[1][0][7],
                                phfo: data[1][0][8],
                                y2: data[1][0][9],
                                y3: data[1][0][10],
                            });
                            // self.totalApplicationCnt(data[0][0][0])
                        }
                    })
                }

                self.dataprovider = new ArrayDataProvider(self.data, {
                    keyAttributes: 'id'
                });

                self.appData = ko.observableArray()

                self.blob = ko.observable()
                self.fileName = ko.observable()

                self.getApplicationReport = ()=>{
                    self.appData([])    
                    let fromDate = self.fromDate()
                    let toDate = self.toDate();
                    let radio = self.selectRadio();
                    let courseType = self.course();
                    courseType = courseType.join(",");
                    let institution = self.institution()
                    institution = institution.join(",");
                    let dataUrl = "/getApplicationCSDReport"
                    if(radio=="ASD"){
                        dataUrl = "/getApplicationASDReport"
                    }
                    $.ajax({
                        url: BaseURL+dataUrl,
                        type: 'POST',
                        data: JSON.stringify({
                            fromDate: fromDate,
                            toDate: toDate,
                            officeId: self.officeId(),
                            courseType: courseType,
                            institutionId : institution
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.appData([])    
                            if(data[0]!="No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.totalApplicationCnt(len)
                                var csvContent = '';
                                var headers = ['Student Id', 'Application Id', 'University', 'firstName', 'Mobile','Nationality', 'Ref',
                                             'Programme',  'Start Date', 'Date Received', 'Offer Status', 'Tution Fee'];
                                csvContent += headers.join(',') + '\n';

                                for(var i=0;i<len;i++){
                                    self.appData.push({
                                        studentId: data[i][0],
                                        applicationId: data[i][1],
                                        university: data[i][2],
                                        firstName: data[i][3],
                                        lastName: data[i][4],
                                        mobile: data[i][5],
                                        nationality: data[i][6],
                                        ref: data[i][7],
                                        programme:data[i][8],
                                        startDate:data[i][9],
                                        dateReceived:data[i][10],
                                        offerStatus:data[i][11],
                                        tutionFee:data[i][12]
                                    });
                                    
                                    var rowData = [data[i][0], data[i][1], data[i][2], data[i][3],data[i][5], data[i][6], data[i][7], 
                                                    data[i][8], data[i][9], data[i][10], data[i][11], data[i][12] ]; 
                                    csvContent += rowData.join(',') + '\n';
                                }
                                
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'data_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.blob(blob);
                                self.fileName(fileName);
                            }
                            else{
                                var csvContent = '';
                                var headers = ['Student Id', 'Application Id', 'University', 'firstName', 'Mobile','Nationality', 'Ref',
                                            'Programme',  'Start Date', 'Date Received', 'Offer Status', 'Tution Fee'];
                                csvContent += headers.join(',') + '\n';
                                self.appData([])    
                                var rowData = []; 
                                csvContent += rowData.join(',') + '\n';
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'data_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.blob(blob);
                                self.fileName(fileName);
                            }
                        }
                    })
                }

                self.applicantCount = ko.observable();
                self.conditionApplicationCnt = ko.observable();
                self.unconditionApplicationCnt = ko.observable();

                self.getApplicationCount = ()=>{
                    self.appData([])    
                    let fromDate = self.fromDate()
                    let toDate = self.toDate();
                    let radio = self.selectRadio();
                    let dataUrl = "/getApplicationCSDCount"
                    let courseType = self.course();
                    courseType = courseType.join(",");
                    let institution = self.institution()
                    institution = institution.join(",");
                    if(radio=="ASD"){
                        dataUrl = "/getApplicationASDCount"
                    }
                    $.ajax({
                        url: BaseURL+dataUrl,
                        type: 'POST',
                        data: JSON.stringify({
                            fromDate: fromDate,
                            toDate: toDate,
                            officeId: self.officeId(),
                            courseType: courseType
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!="No data found"){
                                data = JSON.parse(data);
                                self.applicantCount(data[0][0]);
                                self.conditionApplicationCnt(data[0][2]);
                                self.unconditionApplicationCnt(data[0][1]);
                            }
                            else{
                                self.applicantCount(0)
                                self.conditionApplicationCnt(0)
                                self.unconditionApplicationCnt(0)
                            }
                        }
                    })
                }

                self.showData = ()=>{
                    let popup = document.getElementById("progressBar");
                    popup.open();
                    self.getApplicationReport();
                    self.getApplicationCount();
                    popup = document.getElementById("progressBar");
                    popup.close();
                }

                self.downloadExcel = ()=> {
                    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                      // For Internet Explorer
                      window.navigator.msSaveOrOpenBlob(self.blob(), self.fileName());
                    } else {
                      // For modern browsers
                      var link = document.createElement('a');
                      link.href = window.URL.createObjectURL(self.blob());
                      link.download = self.fileName();
                      link.style.display = 'none';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }
                  
                self.comparator = (a, b) => {
                    if (a === b) {
                        return 0;
                    }
                    const dateA = new Date(a).getTime();
                    const dateB = new Date(b).getTime();
                    return dateA < dateB ? -1 : 1;
                };

                self.filter = ko.observable('');

                self.applicationDataProvider = ko.computed(function () {
                    let filterCriterion = null;
                    if (self.filter() && this.filter() != '') {
                        filterCriterion = ojdataprovider_1.FilterFactory.getFilter({
                            filterDef: { text: self.filter() }
                        });
                    }
                    const arrayDataProvider = new ArrayDataProvider(self.appData, { 
                        keyAttributes: 'studentId',
                        sortComparators: {
                            comparators: new Map().set("dateReceived", self.comparator),
                        },
                    });
                    
                    return new ListDataProviderView(arrayDataProvider, { filterCriterion: filterCriterion });
                }, self);

                self.courseTypes = [
                    { value: 'All', label: 'All' },
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

                self.institution = ko.observable(["All"])
                self.institutionList = ko.observableArray()
                self.getInstitutions = ()=>{
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
                                self.institutionList.push({value: `All`, label: `All`})
                                for(let i=0;i<len;i++){
                                    self.institutionList.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                            }
                        }
                    })
                }
                self.getInstitutions()

                self.countryChangeHandler = (e)=>{
                    let country = e.target.value
                    country = country.join(",");
                    self.institutionList([])
                    $.ajax({
                        url: BaseURL+"/getCountryInstitutionProfile",
                        type: 'POST',
                        data: JSON.stringify({
                            country: country,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                // self.institutionList.push({value: `All`, label: `All`})
                                for(let i=0;i<len;i++){
                                    self.institutionList.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                            }
                        }
                    })
                }
                self.institutionSet = new ArrayDataProvider(self.institutionList, {
                    keyAttributes: 'value'
                });
                self.getInstitutions();

                self.courseChangedHandler = ()=>{
                    self.getApplicationReport()
                    self.getApplicationCount()
                }
                
                self.yearChangedHandler = ()=>{
                    self.course(["All"])
                    self.institution(["All"])
                    self.getCount()
                    self.getApplicationReport()
                    self.getApplicationCount()
                    self.appData([])    
                }

                self.viewProfile = (e)=>{
                    // window.location.href = `/?ojr=studentProfile&id=${e.currentTarget.id}`;
                    window.open(`/?ojr=studentProfile&id=${e.currentTarget.id}`, "_blank");
                }
                
                self.handleValueChanged = () => {
                    self.filter(document.getElementById('filter').rawValue);
                };

                self.stIdRightClick = ko.observable();
                self.myActionFunction = (event) => {
                    let menu = event.detail.selectedValue;
                    if(menu=="openNewTab"){
                        if(self.stIdRightClick()!=undefined){
                            window.open(`/?ojr=studentProfile&id=${self.stIdRightClick()}`, "_blank");
                        }
                    }
                };

                self.myBeforeOpenFunction = (event) => {
                    const target = event.detail.originalEvent.target;
                    const context = document.getElementById("table1").getContextByNode(target);
                    self.stIdRightClick(context.key);
                };

                self.getCount();
                self.getApplicationReport();
                self.getApplicationCount()

                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        app.onAppSuccess();
                    }
                }

            }
        }
        return  ApplicationReport;
    }
);