define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojconverterutils-i18n", 
    "ojs/ojselectsingle", "ojs/ojswitcher", "ojs/ojformlayout", "ojs/ojinputtext", "ojs/ojdatetimepicker", "ojs/ojradioset", 
    "ojs/ojtable", "ojs/ojselectcombobox", "ojs/ojfilepicker", "ojs/ojinputnumber", "ojs/ojdatetimepicker", 
    "ojs/ojvalidationgroup", "ojs/ojcheckboxset"], 
    function (oj,ko,$, app, ArrayDataProvider, ojconverterutils_i18n_1) {

        class InstitutionProfile {
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

                let fileInstitutionId = sessionStorage.getItem("institutionId")
                if(fileInstitutionId){
                    sessionStorage.removeItem("institutionId")
                    $.ajax({
                        url: BaseURL+"/getInstitutionWithId",
                        type: 'POST',
                        data: JSON.stringify({
                            institutionId : fileInstitutionId,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                self.institutionDr(data[0][0]),
                                self.institutionTypeDr(data[0][2]),
                                self.countrySetDr(data[0][5])
                                self.showInstitutionProfile()
                            }
                        }
                    })

                }

                self.viewProfile = (e)=>{
                    // window.location.href = `/?ojr=studentProfile&id=${e.currentTarget.id}`;
                    window.open(`/?ojr=studentProfile&id=${e.currentTarget.id}`, "_blank");
                }
                
                self.institutionTypes = [
                    { value: 'All', label: 'All' },
                    { value: 'College', label: 'College' },
                    { value: 'University', label: 'Universities' },
                    { value: 'Pathways', label: 'Pathways' },
                ];
                self.institutionTypeSet = new ArrayDataProvider(self.institutionTypes, {
                    keyAttributes: 'value'
                });
                
                self.institutionTypeDr = ko.observable('');

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
                self.countrySetDr = ko.observable('')

                self.institutionList = ko.observableArray()
                self.instituteChangeHandler = ()=>{
                    self.institutionList([])
                    $.ajax({
                        url: BaseURL+"/getInstitutionsName",
                        type: 'POST',
                        data: JSON.stringify({
                            institutionType : self.institutionTypeDr(),
                            country : self.countrySetDr()
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
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
                self.institutionDr = ko.observable()

                self.previewClick = (e)=>{
                    let popup = document.getElementById("progress");
                    popup.open();
                    $.ajax({
                        url: BaseURL+"/getContractFile",
                        type: 'POST',
                        data: JSON.stringify({
                            fileName : e.target.id
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            let popup = document.getElementById("progress");
                            popup.close();
                            var fileType = data[1]
                            var base64Code = data[0][0];
                            console.log(data);
                            if(fileType=="pdf"){
                                var byteCharacters = atob(base64Code);
                                var byteNumbers = new Array(byteCharacters.length);
                                for (var i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                var byteArray = new Uint8Array(byteNumbers);
                                var blob = new Blob([byteArray], { type: 'application/pdf' });

                                var blobUrl = URL.createObjectURL(blob);
                                window.open(blobUrl, '_blank');
                            }
                            else if(fileType=="image"){
                                var newWindow = window.open();
                                newWindow.document.write('<html><head><title>Image Viewer</title></head><body>');
                                newWindow.document.write('<img src="data:image/png;base64,' + base64Code + '" alt="Base64 Image">');
                                newWindow.document.write('</body></html>');
                            }
                            else if(fileType=="xl"){
                                var excelDataUri = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + base64Code;
                                var downloadLink = document.createElement('a');
                                downloadLink.href = excelDataUri;
                                downloadLink.download = self.offerFile();
                                document.body.appendChild(downloadLink);
                                downloadLink.click();
                            }
                            else if(fileType=="csv"){
                                var csvDataUri = 'data:text/csv;base64,' + base64Code;
                                var downloadLink = document.createElement('a');
                                downloadLink.href = csvDataUri;
                                downloadLink.download = self.offerFile();
                                document.body.appendChild(downloadLink);
                                downloadLink.click();
                                document.body.removeChild(downloadLink);
                            }
                            else{
                                self.offerFileMessage("File not found")
                                setTimeout(()=>{
                                    self.offerFileMessage("")
                                },3000)
                            }
                        }
                    })
                }

                const tabData = [
                    { name: 'Details', id: 'details'},
                    { name: 'Applications', id: 'applications'},
                    { name: 'Final Choice', id: 'finalChoice'},
                    { name: 'Contract Files', id: 'contractFiles'},
                    { name: 'Commission rate new', id: 'commissionRate'},
                    { name: 'Add Logs', id: 'logs'}
                ];
                self.tabDataProvider = new ArrayDataProvider(tabData, { keyAttributes: 'id' });
                self.selectedItem = ko.observable("details");

                self.territories = [
                    { value: 'Nepal', label: 'Nepal' },
                    { value: 'India', label: 'India' },
                    { value: 'UAE', label: 'UAE' },
                    { value: 'Global', label: 'Global' },
                ];
                self.territorySet = new ArrayDataProvider(self.territories, {
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

                self.institutionId = ko.observable();
                self.institution = ko.observable();
                self.institutionType = ko.observable();
                self.email = ko.observable();
                self.emailError = ko.observable('');
                self.invoiceEmail = ko.observable('');
                self.invoiceEmailError = ko.observable('');
                self.commissionable = ko.observable('');
                self.homePage = ko.observable();
                self.country = ko.observable();
                self.territory = ko.observable();
                self.commissionRate = ko.observable();

                const currentDate1 = new Date();
                const year1 = currentDate1.getFullYear();
                const month1 = currentDate1.getMonth();
                const day1 = currentDate1.getDate();

                self.validFrom = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year1, month1,day1)));
                self.validUntil = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year1, month1,day1)));
                self.bonus = ko.observable();
                self.courseType = ko.observableArray();
                self.applicationMethod = ko.observable();
                self.agentPortalDetails = ko.observable();
                self.restrictionNotes = ko.observable();
                self.fileNames = ko.observableArray(new Array());

                self.selectListener = (event) => {
                    const files = event.detail.files;
                    if(self.institutionId()=="" || self.institutionId()==undefined){
                        document.getElementById("file-error").style.display = "block"
                        setTimeout(()=>{
                            document.getElementById("file-error").style.display = "none"
                        }, 3000)
                    }
                    else{
                        Array.prototype.map.call(files, (file) => {
                            self.fileNames.push({"file" : file.name});
                            var formData = new FormData();
                            formData.append("file", file);
                            formData.append("institutionId", self.institutionId())
                            $.ajax({
                                url:   BaseURL + "/contractFileUpload",
                                type: "POST",
                                data:  formData,
                                cache: false,
                                contentType: false,
                                processData: false,
                                error: function (jqXHR, textStatus, errorThrown) {
                                    console.log(textStatus);
                                },
                                success: (data) => {
                                    console.log(data);
                                }
                            });
                        })
                    }
                }; 

                self.removeFile = (e)=>{
                    var fileNamesOfObjects = self.fileNames().map(pair => pair.file);
                    var index = fileNamesOfObjects.indexOf(e.target.id);
                    if (index !== -1) {
                        fileNamesOfObjects.splice(index, 1);
                    }
                    self.fileNames(fileNamesOfObjects.map((value, index) => ({"no":index+1, "file": value })));
                }

                self.showInstitutionProfile = ()=>{
                    let popup = document.getElementById("progress");
                    popup.open();
                    self.institutionId('')
                    self.institution('')
                    self.institutionType('');
                    self.email('');
                    self.homePage('');
                    self.country('');
                    self.territory('');
                    self.commissionRate();
                    self.bonus('');
                    self.courseType([]);
                    self.applicationMethod('');
                    self.agentPortalDetails('');
                    self.restrictionNotes('');
                    $.ajax({
                        url: BaseURL+"/getInstitutionProfile",
                        type: 'POST',
                        data: JSON.stringify({
                            institutionId : self.institutionDr(),
                            institutionType : self.institutionTypeDr(),
                            country : self.countrySetDr()
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.fileNames([])
                                for(let i=0;i<len;i++){
                                    self.institutionId(data[i][0]);
                                    self.institution(data[i][1]);
                                    self.institutionType(data[i][2]);
                                    self.email(data[i][3]);
                                    self.homePage(data[i][4]);
                                    self.country(data[i][5]);
                                    self.territory(data[i][6]);
                                    if(data[i][7]==null || data[i][7]==""){
                                        self.commissionRate(null);
                                    }
                                    else{
                                        let commissionRate = parseFloat(data[i][7], 10);
                                        self.commissionRate(commissionRate);
                                    }
                                    self.bonus(data[i][8]);
                                    self.applicationMethod(data[i][9]);
                                    self.agentPortalDetails(data[i][10]);
                                    let courseType = data[i][11];
                                    courseType = courseType.split(',');
                                    self.courseType(courseType);
                                    self.restrictionNotes(data[i][12]);
                                    if(data[i][13]!=null){
                                        var filesArray = data[i][13].split(',');
                                        let l = filesArray.length;
                                        for(let j=0;j<l;j++){
                                            self.fileNames.push({"no": j+1, "file" :filesArray[j]});
                                        }
                                    }
                                    self.validFrom(data[i][14])
                                    self.validUntil(data[i][15])
                                    self.invoiceEmail(data[i][16])
                                    self.commissionable(data[i][17])
                                }
                            }
                            self.viewApplications()
                            self.showApplicationYearData()
                            self.viewFinalChoices()
                            self.viewCommissionDetails()
                            self.getNotes()
                            let popup = document.getElementById("progress");
                            popup.close();
                        }
                    })
                }

                self.fileDataProvider = new ArrayDataProvider(self.fileNames, {
                    keyAttributes: 'id'
                });

                self.emailPatternValidator = (email)=>{
                    if(email=="" || email==null){
                        return true;
                    }
                    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                    if(email.match(mailformat)){
                        self.emailError('')
                    }
                    else{
                        self.emailError("Should enter a valid email address.");
                    }   
                    return email.match(mailformat);
                }

                self.updateInstitution = ()=>{
                    if(self.emailPatternValidator(self.email())  && self.emailPatternValidator(self.invoiceEmail())){
                        let popup = document.getElementById("progress");
                        popup.open();
                        let courseType = self.courseType();
                        courseType = courseType.join(",");
                        $.ajax({
                            url: BaseURL+"/updateInstitutionProfile",
                            type: 'POST',
                            data: JSON.stringify({
                                institutionId : self.institutionDr(),
                                institutionName : self.institution(),
                                institutionType : self.institutionType(),
                                email : self.email(),
                                homePage : self.homePage(),
                                country : self.country(),
                                territory : self.territory(),
                                commissionRate : self.commissionRate(),
                                invoiceMail : self.invoiceEmail(),
                                bonus : self.bonus(),
                                applicationMethod : self.applicationMethod(),
                                agentPortalDetails : self.agentPortalDetails(),
                                courseType : courseType,
                                restrictionNotes : self.restrictionNotes(),
                                validFrom : self.validFrom(),
                                validUntil : self.validUntil(),
                                commissionable : self.commissionable()
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                self.showInstitutionProfile()
                            }
                        })
                    }
                }

                self.updateContractFiles = ()=>{
                    let popup = document.getElementById("progress");
                    popup.open();
                    var fileNamesOfObjects = self.fileNames().map(pair => pair.file);
                    let contractFiles = fileNamesOfObjects
                    if(contractFiles.length!=0){
                        contractFiles = contractFiles.join(",");
                    }
                    else{
                        contractFiles = null;
                    }
                    $.ajax({
                        url: BaseURL+"/updateContractFiles",
                        type: 'POST',
                        data: JSON.stringify({
                            institutionId : self.institutionDr(),
                            contractFiles : contractFiles,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.showInstitutionProfile()
                        }
                    })
                }

                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const day = currentDate.getDate();

                self.applicationFromValue = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, 0, 1)));
                self.applicationToValue = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, month,day)));
                self.selectApplicationRadio = ko.observable("ASD");                
                self.applicationOffice = ko.observable();
                self.finalChoiceOffice = ko.observable()
                self.offices = [];

                self.getOffices = ()=>{
                    $.ajax({
                        url: BaseURL+"/getOffices",
                        type: 'GET',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.offices.push({value: `All`, label: `All`})
                                for(let i=0;i<len;i++){
                                    self.offices.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                                self.applicationOffice(["All"])
                                self.finalChoiceOffice(["All"])
                            }
                        }
                    })
                }
                self.officesDP = new ArrayDataProvider(self.offices, {
                    keyAttributes: 'value'
                });
                self.getOffices()

                self.applicationBlob = ko.observable();
                self.applicationFileName = ko.observable();

                self.applicationYearData = ko.observableArray();
                
                self.showApplicationYearData = ()=>{
                    let institution = self.institutionDr()
                    let fromDate = self.applicationFromValue()
                    let toDate = self.applicationToValue();
                    let office = self.applicationOffice();
                    office = office.join(",");
                    let radio = self.selectApplicationRadio();
                    self.applicationData([]);
                    let dataUrl = "/getApplicationsInstitutionProfileYearCountASDReport"
                    if(radio=="CSD"){
                        dataUrl = "/getApplicationsInstitutionProfileYearCountCSDReport"   
                    }
                    self.applicationYearData([])
                    $.ajax({
                        url: BaseURL+dataUrl,
                        type: 'POST',
                        data: JSON.stringify({
                            institutionId:institution,
                            fromDate: fromDate,
                            toDate: toDate,
                            officeId: office,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                let len = data.length;
                                for(let i=0;i<len;i++){
                                    self.applicationYearData.push({
                                        year: data[i][0],
                                        totalApplications: data[i][1],
                                        totalConditional: data[i][3],
                                        totalUnconditional: data[i][2],
                                        totalRejected: data[i][4],
                                        totalPending: data[i][5]
                                    });
                                }
                            }
                        }
                    })
                }

                self.applicationYeardataprovider = new ArrayDataProvider(self.applicationYearData, { keyAttributes: 'id' });

                self.applicationData = ko.observableArray();

                self.viewApplications = ()=>{
                    let institution = self.institutionDr()
                    if(institution==undefined){
                        document.getElementById("instituteAppMessage").style.display = "block";
                        setTimeout(()=>{
                            document.getElementById("instituteAppMessage").style.display = "none";
                        }, 5000);
                    }
                    else{
                        let fromDate = self.applicationFromValue()
                        let toDate = self.applicationToValue();
                        let office = self.applicationOffice();
                        office = office.join(",");
                        let radio = self.selectApplicationRadio();
                        self.applicationData([]);
                        let popup = document.getElementById("progress");
                        popup.open();
                        let dataUrl = "/getApplicationsInstitutionProfileASDReport"
                        if(radio=="CSD"){
                            dataUrl = "/getApplicationsInstitutionProfileCSDReport"   
                        }
                        $.ajax({
                            url: BaseURL+dataUrl,
                            type: 'POST',
                            data: JSON.stringify({
                                institutionId:institution,
                                fromDate: fromDate,
                                toDate: toDate,
                                officeId: office,
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                var csvContent = '';
                                var headers = ['Student Id', 'Course', 'Name', 'Office', 'Staff','Application Send Date', 'Course Start Date', 
                                            'Status', 'Nationality',  'Mobile', 'Email', 'Lead Source', 'UTM Source'];
                                csvContent += headers.join(',') + '\n';
                                if(data[0]!='No data found'){
                                    data = JSON.parse(data);
                                    let len = data.length;

                                    for(let i=0;i<len;i++){
                                        self.applicationData.push({
                                            "studentId" : data[i][0],
                                            "course" : data[i][1],
                                            "name" : data[i][2]+" "+data[i][3],
                                            "office" : data[i][4],
                                            "staff" : data[i][5],
                                            "asd" : data[i][6],
                                            "csd" : data[i][7],
                                            "status" : data[i][8],
                                            "nationality" : data[i][9],
                                            "mobile" : data[i][10],
                                            "email" : data[i][11],
                                            "leadSource" : data[i][12],
                                            "utmSource" : data[i][13],
                                        });
                                        var rowData = [data[i][0], data[i][1], data[i][2]+" "+data[i][3], data[i][4], data[i][5], data[i][6], data[i][7], 
                                                    data[i][8], data[i][9], data[i][10], data[i][11], data[i][12], data[i][13] ]; 
                                        csvContent += rowData.join(',') + '\n';
                                    }
                                    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    var today = new Date();
                                    var fileName = 'Application_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                    self.applicationBlob(blob);
                                    self.applicationFileName(fileName);
                                }
                                else{
                                    var rowData = []; 
                                    csvContent += rowData.join(',') + '\n';
                                    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    var today = new Date();
                                    var fileName = 'Application_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                    self.applicationBlob(blob);
                                    self.applicationFileName(fileName);
                                }
                                let popup = document.getElementById("progress");
                                popup.close();
                            }
                        })
                    }
                }

                self.applicationDataprovider = new ArrayDataProvider(self.applicationData, { keyAttributes: 'id' });

                self.downloadApplicationData = ()=>{
                    if(self.applicationBlob() != undefined && self.applicationFileName() != undefined){
                        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                            window.navigator.msSaveOrOpenBlob(self.applicationBlob(), self.applicationFileName());
                        } else {
                            var link = document.createElement('a');
                            link.href = window.URL.createObjectURL(self.applicationBlob());
                            link.download = self.applicationFileName();
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    }
                }

                self.finalChoiceFromValue = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, 0, 1)));
                self.finalChoiceToValue = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, month,day)));                
                self.selectFinalChoiceRadio = ko.observable("ASD");

                self.finalChoiceTotalCount = ko.observable();
                self.finalChoicePgCount = ko.observable();
                self.finalChoiceUgCount = ko.observable();
                self.finalChoicePathwayCount = ko.observable();
                self.finalChoiceYear2Count = ko.observable();
                self.finalChoiceYear3Count = ko.observable();
                self.finalChoicePresessionCount = ko.observable();
                self.finalChoiceOtherCount = ko.observable();

                self.getCourseTypeFinalChoiceCount = ()=>{
                    let institution = self.institutionDr()
                    let fromDate = self.finalChoiceFromValue()
                    let toDate = self.finalChoiceToValue();
                    let office = self.finalChoiceOffice();
                    office = office.join(",");
                    let radio = self.selectFinalChoiceRadio();
                    let dataUrl = "/getFinalChoicesInstitutionCourseTypeASDCount"
                    if(radio=="CSD"){
                        dataUrl = "/getFinalChoicesInstitutionCourseTypeCSDCount"   
                    }
                    $.ajax({
                        url: BaseURL+dataUrl,
                        type: 'POST',
                        data: JSON.stringify({
                            institutionId:institution,
                            fromDate: fromDate,
                            toDate: toDate,
                            officeId: office,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                self.finalChoiceTotalCount(data[0][0]);
                                self.finalChoicePgCount(data[0][1]);
                                self.finalChoiceUgCount(data[0][2]);
                                self.finalChoicePathwayCount(data[0][3]);
                                self.finalChoiceYear2Count(data[0][4]);
                                self.finalChoiceYear3Count(data[0][5]);
                                self.finalChoicePresessionCount(data[0][6]);
                                self.finalChoiceOtherCount(data[0][7]);
                            }
                        }
                    })
                }

                self.finalChoiceData = ko.observableArray();

                self.finalChoiceBlob = ko.observable();
                self.finalChoiceFileName = ko.observable();

                self.viewFinalChoices = ()=>{
                    self.getCourseTypeFinalChoiceCount()
                    let institution = self.institutionDr()
                    if(institution==undefined){
                        document.getElementById("instituteFinalMessage").style.display = "block";
                        setTimeout(()=>{
                            document.getElementById("instituteFinalMessage").style.display = "none";
                        }, 5000);
                    }
                    else{
                        let fromDate = self.finalChoiceFromValue()
                        let toDate = self.finalChoiceToValue();
                        let office = self.finalChoiceOffice();
                        office = office.join(",");
                        let radio = self.selectFinalChoiceRadio();
                        let popup = document.getElementById("progress");
                        popup.open();
                        let dataUrl = "/getFinalChoicesInstitutionProfileASDReport"
                        if(radio=="CSD"){
                            dataUrl = "/getFinalChoicessInstitutionProfileCSDReport"   
                        }
                        self.finalChoiceData([])
                        $.ajax({
                            url: BaseURL+dataUrl,
                            type: 'POST',
                            data: JSON.stringify({
                                institutionId:institution,
                                fromDate: fromDate,
                                toDate: toDate,
                                officeId: office,
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                var csvContent = '';
                                var headers = ['Student Id', 'Name', 'Email', 'Nationality', 'Office', 'Course Type', 'Course', 'Staff',
                                            'Course Start Date', 'Tution Fee', 'Commission', 'Total Commission', 'UTM Source', 'UTM Medium', 'UTM Campaign', 
                                            'Lead Source'];
                                csvContent += headers.join(',') + '\n';
                                if(data[0]!='No data found'){
                                    data = JSON.parse(data);
                                    let len = data.length;
                                    for(let i=0;i<len;i++){
                                        let commissionPerc = (data[i][10]*data[i][11])/100
                                        let tutionFee = parseInt(data[i][10], 10);
                                        let totalCommission = commissionPerc;
                                        self.finalChoiceData.push({
                                            "studentId" : data[i][0],
                                            "name" : data[i][1]+" "+data[i][2],
                                            "email" : data[i][3],
                                            "nationality" : data[i][4],
                                            "office" : data[i][5],
                                            "courseType" : data[i][6],
                                            "course" : data[i][7],
                                            "staff" : data[i][8],
                                            "csd" : data[i][9],
                                            "tutionFee" : data[i][10],
                                            "commission" : data[i][11],
                                            "totalCommission" : totalCommission,
                                            "utmSource" : data[i][12],
                                            "utmMedium" : data[i][13],
                                            "utmCampaign" : data[i][14],
                                            "leadSource" : data[i][15],
                                            "invoiceNo" : data[i][16],
                                            "invoiceSent" : [data[i][17]],
                                            "paidToUs" : [data[i][18]],
                                            "applicationId" : data[i][19]
                                        });
                                        var rowData = [data[i][0], data[i][1]+" "+data[i][2], data[i][3], data[i][4], data[i][5], data[i][6], data[i][7], 
                                            data[i][8], data[i][9], data[i][10], data[i][11], totalCommission, data[i][12], data[i][13], data[i][14], data[i][15] ]; 
                                        csvContent += rowData.join(',') + '\n';
                                    }
                                    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    var today = new Date();
                                    var fileName = 'FinalChoice_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                    self.finalChoiceBlob(blob);
                                    self.finalChoiceFileName(fileName);
                                }
                                else{
                                    var rowData = []; 
                                    csvContent += rowData.join(',') + '\n';
                                    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    var today = new Date();
                                    var fileName = 'FinalChoice_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                    self.finalChoiceBlob(blob);
                                    self.finalChoiceFileName(fileName);
                                }
                                let popup = document.getElementById("progress");
                                popup.close();
                            }
                        })
                    }
                }

                self.finalChoiceDataprovider = new ArrayDataProvider(self.finalChoiceData, { keyAttributes: 'id' });

                self.editInvoiceNo = ko.observable();
                self.editInvoiceSent = ko.observable();
                self.editPaidToUs = ko.observable();
                self.editApplicationId = ko.observable();

                self.editInvoiceDetails = (e)=>{
                    let applicationId = e.currentTarget.id;
                    self.editApplicationId(applicationId);
                    $.ajax({
                        url: BaseURL+"/getApplicationInvoiceDetails",
                        type: 'POST',
                        data: JSON.stringify({
                            applicationId:applicationId,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                self.editInvoiceNo(data[0][0]);
                                self.editInvoiceSent([data[0][1]]);
                                self.editPaidToUs([data[0][2]]);
                            }
                            let editInvoice = document.getElementById("editInvoice");
                            editInvoice.open();
                        }
                    })
                }

                self.editInvoiceCancel = ()=>{
                    let editInvoice = document.getElementById("editInvoice");
                    editInvoice.close();
                }

                self.updateInvoiceDetails = ()=>{
                    const formValid = self._checkValidationGroup("invoiceForm"); 
                    if(formValid){
                        let invoiceNo = self.editInvoiceNo()
                        let invoiceSent = self.editInvoiceSent()
                        let paidToUs = self.editPaidToUs()
                        if(invoiceSent==undefined || invoiceSent==""){
                            invoiceSent = null;
                        }
                        else{
                            invoiceSent = invoiceSent[0];
                        }

                        if(paidToUs==undefined || paidToUs==""){
                            paidToUs = null;
                        }
                        else{
                            paidToUs = paidToUs[0];
                        }
                        $.ajax({
                            url: BaseURL+"/updateApplicationInvoiceDetails",
                            type: 'POST',
                            data: JSON.stringify({
                                applicationId :self.editApplicationId(),
                                invoiceNumber : invoiceNo,
                                invoiceSent : invoiceSent,
                                paidToUs : paidToUs,
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                self.viewFinalChoices();
                                let editInvoice = document.getElementById("editInvoice");
                                editInvoice.close();
                            }
                        })
                    }
                }

                self.exportFinalChoices = ()=>{
                    if(self.finalChoiceBlob() != undefined && self.finalChoiceFileName() != undefined){
                        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                            window.navigator.msSaveOrOpenBlob(self.finalChoiceBlob(), self.finalChoiceFileName());
                        } else {
                            var link = document.createElement('a');
                            link.href = window.URL.createObjectURL(self.finalChoiceBlob());
                            link.download = self.finalChoiceFileName();
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    }
                }

                self.commissionData = ko.observableArray();

                self.instituteMessage = ko.observable()

                self.viewCommissionDetails = ()=>{
                    self.commissionData([])
                    let institution = self.institutionDr()
                    if(institution==undefined){
                        document.getElementById("instituteMessage").style.display = "block";
                        setTimeout(()=>{
                            document.getElementById("instituteMessage").style.display = "none";
                        }, 5000);
                    }
                    else{
                        let popup = document.getElementById("progress");
                        popup.open();
                        $.ajax({
                            url: BaseURL+"/getCommissionDetails",
                            type: 'POST',
                            data: JSON.stringify({
                                institutionId:institution,
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                if(data[0]!='No data found'){
                                    data = JSON.parse(data);
                                    let len = data.length;
                                    for(let i=0;i<len;i++){
                                        self.commissionData.push({
                                            "sl" : i+1,
                                            "commissionId" : data[i][0],
                                            "courseType" : data[i][1],
                                            "courseName" : data[i][2],
                                            "validFrom" : data[i][3],
                                            "validUntil" : data[i][4],
                                            "minNumber" : data[i][5],
                                            "maxNumber" : data[i][6],
                                            "commission" : data[i][7],
                                            "territory" : data[i][9],
                                        })
                                    }
                                }
                                
                            }
                        })
                    }
                }
                self.commissionDataprovider = new ArrayDataProvider(self.commissionData, { keyAttributes: 'id' });

                self.commissionCourseType = ko.observable();
                self.commissionCommissionable = ko.observable();
                self.commissionValidFrom = ko.observable();
                self.commissionValidUntil = ko.observable();
                self.commissionMinNumber = ko.observable();
                self.commissionMaxNumber = ko.observable();
                self.commissionPercent = ko.observable();
                self.commissionTerritory = ko.observable();

                self.addCommissionRate = ()=>{
                    let addCommission = document.getElementById("addCommission");
                    addCommission.open();
                }

                self.addCommissionCancel = ()=>{
                    let addCommission = document.getElementById("addCommission");
                    addCommission.close();
                }

                self.submitCommission = ()=>{
                    if(self.institutionId()==undefined || self.institutionId()==""){
                        document.getElementById("commission-error").style.display = "block"
                        setTimeout(function() {
                            document.getElementById("commission-error").style.display = "none"
                            self.addCommissionCancel()
                        }, 1000);
                    }
                    else{
                        const formValid = self._checkValidationGroup("commissionForm"); 
                        if(formValid){
                            let courseType = self.commissionCourseType();
                            courseType = courseType.join(",");
                            let popup = document.getElementById("progress");
                            popup.open();
                            $.ajax({
                                url: BaseURL+"/submitCommission",
                                type: 'POST',
                                data: JSON.stringify({
                                    institutionId: self.institutionId(),
                                    commissionCourseType: courseType,
                                    commissionCommissionable: self.commissionCommissionable(),
                                    commissionValidFrom: self.commissionValidFrom(),
                                    commissionValidUntil: self.commissionValidUntil(),
                                    commissionMinNumber: self.commissionMinNumber(),
                                    commissionMaxNumber: self.commissionMaxNumber(),
                                    commissionPercent: self.commissionPercent(),
                                    commissionTerritory: self.commissionTerritory(),
                                }),
                                dataType: 'json',
                                error: function (xhr, textStatus, errorThrown) {
                                    console.log(textStatus);
                                },
                                success: function (data) {
                                    self.viewCommissionDetails();
                                    self.addCommissionCancel();
                                    
                                    self.commissionCourseType(undefined);
                                    self.commissionCommissionable(undefined);
                                    self.commissionValidFrom(undefined);
                                    self.commissionValidUntil(undefined);
                                    self.commissionMinNumber(undefined);
                                    self.commissionMaxNumber(undefined);
                                    self.commissionPercent(undefined);
                                    self.commissionTerritory(undefined);

                                    let popup = document.getElementById("progress");
                                    popup.close();   
                                }
                            })
                        }
                    }
                }

                self.deleteCommission = (e)=>{
                    let commissionId = e.currentTarget.id;
                    let popup = document.getElementById("progress");
                    popup.open();
                    $.ajax({
                        url: BaseURL+"/deleteCommissionRate",
                        type: 'POST',
                        data: JSON.stringify({
                            commissionId: commissionId,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            console.log(data);
                            self.viewCommissionDetails();
                            let popup = document.getElementById("progress");
                            popup.close();   
                        }
                    })
                }

                self.institutionNote = ko.observable()
                self.institutionNoteData = ko.observableArray();

                self.getNotes = ()=>{
                    let institution = self.institutionDr()
                    if(institution==undefined){
                        self.addLogCancel()
                        self.instituteMessage("Please select a institution")
                        setTimeout(()=>{
                            self.instituteMessage("")
                        }, 5000);
                    }
                    else{
                        self.institutionNoteData([])
                        $.ajax({
                            url: BaseURL+"/getInstitutionNotes",
                            type: 'POST',
                            data: JSON.stringify({
                                institutionId : institution
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                if(data[0]!='No data found'){
                                    data = JSON.parse(data);
                                    let len = data.length;
                                    for(let i=0;i<len;i++){
                                        var date = data[i][3];                                    
                                        date = new Date(date);
                                        var year = date.getFullYear();
                                        var month = ('0' + (date.getMonth() + 1)).slice(-2);
                                        var day = ('0' + date.getDate()).slice(-2);
                                        date =  `${day}-${month}-${year}`
                                        self.institutionNoteData.push({
                                            "staffName" : data[i][0],
                                            "note" : data[i][1],
                                            "date" : date,
                                            "noteId" : data[i][4]
                                        })
                                    }
                                }
                            }
                        })
                    }
                }

                self.institutionNoteDataProvider = new ArrayDataProvider(self.institutionNoteData, { keyAttributes: 'id' });

                self.addInstitutionLog = ()=>{
                    let popup = document.getElementById("addLog");
                    popup.open();
                }

                self.addLogCancel = ()=>{
                    let popup = document.getElementById("addLog");
                    popup.close();
                }

                self.submitNotes = ()=>{
                    let institution = self.institutionDr()
                    if(institution==undefined){
                        self.addLogCancel()
                        self.instituteMessage("Please select a institution")
                        setTimeout(()=>{
                            self.instituteMessage("")
                        }, 5000);
                    }
                    else{
                        const formValid = self._checkValidationGroup("formValidation"); 
                        if (formValid) {
                            let popup = document.getElementById("progress");
                            popup.open();
                            $.ajax({
                                url: BaseURL+"/addInstitutionNotes",
                                type: 'POST',
                                data: JSON.stringify({
                                    staffId : sessionStorage.getItem("userId"),
                                    note : self.institutionNote(),
                                    institutionId : institution
                                }),
                                dataType: 'json',
                                error: function (xhr, textStatus, errorThrown) {
                                    console.log(textStatus);
                                },
                                success: function (data) {
                                    let popup = document.getElementById("progress");
                                    popup.close();
                                    self.addLogCancel()
                                    self.institutionNote(""),
                                    self.getNotes()
                                    self.institutionNote(undefined);
                                }
                            })
                        }
                    }
                }

                self.deleteLog = (e)=>{
                    let id = e.target.id;
                    let popup = document.getElementById("progress");
                    popup.open();
                    $.ajax({
                        url: BaseURL+"/deleteInstitutionNote",
                        type: 'POST',
                        data: JSON.stringify({
                            institutionNoteId : id
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            console.log(data);
                            let popup = document.getElementById("progress");
                            popup.close();
                            self.addLogCancel()
                            self.institutionNote(""),
                            self.getNotes()
                        }
                    })
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
        return  InstitutionProfile;
    }
);