define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojtrain", 
    "ojs/ojformlayout","ojs/ojdatetimepicker", "ojs/ojinputtext", "ojs/ojtable", "ojs/ojcheckboxset", "ojs/ojinputnumber",
    "ojs/ojselectsingle", "ojs/ojpopup", "ojs/ojvalidationgroup", "ojs/ojprogress-circle", "ojs/ojfilepicker", "ojs/ojdialog"], 
    function (oj,ko,$, app, ArrayDataProvider) {

        class StudentProfile {
            constructor(args) {
                var self = this;
                
                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL")

                self.userRole = ko.observable(sessionStorage.getItem("userRole"));

                self.studentId = ko.observable();
                const params = new URLSearchParams(window.location.search);
                if(!params.get('id')){
                    self.router.go({path : 'students'});
                }
                const studentId = params.get('id')

                self.student = ko.observable(studentId);
                
                self.firstName = ko.observable('');
                self.lastName = ko.observable('');
                self.studentId = ko.observable('');
                self.marketingSource = ko.observable('');
                self.enquiryDate = ko.observable('');
                self.mobileNumber = ko.observable('');
                self.gender = ko.observable('');
                self.email = ko.observable('');
                self.euStatus = ko.observable('');
                self.dob = ko.observable('');
                self.nationality = ko.observable('');
                self.countryBirth = ko.observable('');
                self.enquiryAbout = ko.observable('');
                self.yearIntake = ko.observable('');
                self.utmSource = ko.observable('');
                self.utmMedium = ko.observable('');
                self.utmCampaign = ko.observable('');

                self.status = ko.observable('');
                self.subStatus = ko.observable('');
                self.office1 = ko.observable();
                self.consultant = ko.observable('');

                self.note = ko.observable('');
                self.contactType = ko.observable('');
                self.leadSource = ko.observable('');

                self.courseType = ko.observable('');
                self.institutionName = ko.observable('');

                self.institutionList = ko.observableArray()
                self.getInstitution = ()=>{
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
                                for(let i=0;i<len;i++){
                                    self.institutionList.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                            }
                        }
                    })
                }
                self.getInstitution()
                self.institutionSet = new ArrayDataProvider(self.institutionList, {
                    keyAttributes: 'value'
                });
                self.institutionId = ko.observable()
                self.instituteChangeHandler = (e)=>{
                    self.institutionName(e.detail.itemContext.data.label);
                }

                self.partner = ko.observable()
                self.partnersList = ko.observableArray()
                self.partners = (officeId)=>{
                    $.ajax({
                        url: BaseURL+"/getPartnerWithOfficeId",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: officeId,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                self.partnersList([])
                                let len = data.length;
                                for(let i=0;i<len;i++){
                                    self.partnersList.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                            }
                        }
                    })
                }
                self.partnersDp = new ArrayDataProvider(self.partnersList, {
                    keyAttributes: 'value'
                });

                self.courseStartDate = ko.observable('');
                self.courseName = ko.observable('');
                self.courseEndDate = ko.observable(null);
                self.applicationSentDate = ko.observable('');
                self.partner = ko.observable('');
                self.tutionFee = ko.observable(0);
                self.loginUrl = ko.observable('');
                self.userName = ko.observable('');
                self.password = ko.observable('');
                self.applicationMethod = ko.observable('');
                self.counsellingType = ko.observable('');
                self.ielts = ko.observable([])

                self.countryCode = ko.observable();
                self.countryCodes = ko.observableArray([]);
                self.countryCodes.push(
                    {"label":"Afghanistan(+93)","value":"+93"},
                    {"label":"Albania(+355)","value":"+355"},
                    {"label":"Algeria(+213)","value":"+213"},
                    {"label":"American Samoa(+1684)","value":"+1684"},
                    {"label":"Andorra(+376)","value":"+376"},
                    {"label":"Angola(+244)","value":"+244"},
                    {"label":"Anguilla(+1264)","value":"+1264"},
                    {"label":"Antarctica(+672)","value":"+672"},
                    {"label":"Antigua and Barbuda(+1268)","value":"+1268"},
                    {"label":"Argentina(+54)","value":"+54"},
                    {"label":"Armenia(+374)","value":"+374"},
                    {"label":"Aruba(+297)","value":"+297"},
                    {"label":"Australia(+61)","value":"+61"},
                    {"label":"Austria(+43)","value":"+43"},
                    {"label":"Azerbaijan(+994)","value":"+994"},
                    {"label":"Bahamas(+1242)","value":"+1242"},
                    {"label":"Bahrain(+973)","value":"+973"},
                    {"label":"Bangladesh(+880)","value":"+880"},
                    {"label":"Barbados(+1246)","value":"+1246"},
                    {"label":"Belarus(+375)","value":"+375"},
                    {"label":"Belgium(+32)","value":"+32"},
                    {"label":"Belize(+501)","value":"+501"},
                    {"label":"Benin(+229)","value":"+229"},
                    {"label":"Bermuda(+1441)","value":"+1441"},
                    {"label":"Bhutan(+975)","value":"+975"},
                    {"label":"Bolivia(+591)","value":"+591"},
                    {"label":"Bosnia and Herzegovina(+387)","value":"+387"},
                    {"label":"Botswana(+267)","value":"+267"},
                    {"label":"Brazil(+55)","value":"+55"},
                    {"label":"British Indian Ocean Territory(+246)","value":"+246"},
                    {"label":"British Virgin Islands(+1284)","value":"+1284"},
                    {"label":"Brunei(+673)","value":"+673"},
                    {"label":"Bulgaria(+359)","value":"+359"},
                    {"label":"Burkina Faso(+226)","value":"+226"},
                    {"label":"Burundi(+257)","value":"+257"},
                    {"label":"Cambodia(+855)","value":"+855"},
                    {"label":"Cameroon(+237)","value":"+237"},
                    {"label":"Canada(+1)","value":"+1"},
                    {"label":"Cape Verde(+238)","value":"+238"},
                    {"label":"Cayman Islands(+1345)","value":"+1345"},
                    {"label":"Central African Republic(+236)","value":"+236"},
                    {"label":"Chad(+235)","value":"+235"},
                    {"label":"Chile(+56)","value":"+56"},
                    {"label":"China(+86)","value":"+86"},
                    {"label":"Christmas Island(+61)","value":"+61"},
                    {"label":"Cocos Islands(+61)","value":"+61"},
                    {"label":"Colombia(+57)","value":"+57"},
                    {"label":"Comoros(+269)","value":"+269"},
                    {"label":"Cook Islands(+682)","value":"+682"},
                    {"label":"Costa Rica(+506)","value":"+506"},
                    {"label":"Croatia(+385)","value":"+385"},
                    {"label":"Cuba(+53)","value":"+53"},
                    {"label":"Curacao(+599)","value":"+599"},
                    {"label":"Cyprus(+357)","value":"+357"},
                    {"label":"Czech Republic(+420)","value":"+420"},
                    {"label":"Democratic Republic of the Congo(+243)","value":"+243"},
                    {"label":"Denmark(+45)","value":"+45"},
                    {"label":"Djibouti(+253)","value":"+253"},
                    {"label":"Dominica(+1767)","value":"+1767"},
                    {"label":"Dominican Republic(+1809)","value":"+1809"},
                    {"label":"East Timor(+670)","value":"+670"},
                    {"label":"Ecuador(+593)","value":"+593"},
                    {"label":"Egypt(+20)","value":"+20"},
                    {"label":"El Salvador(+503)","value":"+503"},
                    {"label":"Equatorial Guinea(+240)","value":"+240"},
                    {"label":"Eritrea(+291)","value":"+291"},
                    {"label":"Estonia(+372)","value":"+372"},
                    {"label":"Ethiopia(+251)","value":"+251"},
                    {"label":"Falkland Islands(+500)","value":"+500"},
                    {"label":"Faroe Islands(+298)","value":"+298"},
                    {"label":"Fiji(+679)","value":"+679"},
                    {"label":"Finland(+358)","value":"+358"},
                    {"label":"France(+33)","value":"+33"},
                    {"label":"French Polynesia(+689)","value":"+689"},
                    {"label":"Gabon(+241)","value":"+241"},
                    {"label":"Gambia(+220)","value":"+220"},
                    {"label":"Georgia(+995)","value":"+995"},
                    {"label":"Germany(+49)","value":"+49"},
                    {"label":"Ghana(+233)","value":"+233"},
                    {"label":"Gibraltar(+350)","value":"+350"},
                    {"label":"Greece(+30)","value":"+30"},
                    {"label":"Greenland(+299)","value":"+299"},
                    {"label":"Grenada(+1473)","value":"+1473"},
                    {"label":"Guam(+1671)","value":"+1671"},
                    {"label":"Guatemala(+502)","value":"+502"},
                    {"label":"Guernsey(+441481)","value":"+441481"},
                    {"label":"Guinea(+224)","value":"+224"},
                    {"label":"Guinea-Bissau(+245)","value":"+245"},
                    {"label":"Guyana(+592)","value":"+592"},
                    {"label":"Haiti(+509)","value":"+509"},
                    {"label":"Honduras(+504)","value":"+504"},
                    {"label":"Hong Kong(+852)","value":"+852"},
                    {"label":"Hungary(+36)","value":"+36"},
                    {"label":"Iceland(+354)","value":"+354"},
                    {"label":"India(+91)","value":"+91"},
                    {"label":"Indonesia(+62)","value":"+62"},
                    {"label":"Iran(+98)","value":"+98"},
                    {"label":"Iraq(+964)","value":"+964"},
                    {"label":"Ireland(+353)","value":"+353"},
                    {"label":"Isle of Man(+441624)","value":"+441624"},
                    {"label":"Israel(+972)","value":"+972"},
                    {"label":"Italy(+39)","value":"+39"},
                    {"label":"Ivory Coast(+225)","value":"+225"},
                    {"label":"Jamaica(+1876)","value":"+1876"},
                    {"label":"Japan(+81)","value":"+81"},
                    {"label":"Jersey(+441534)","value":"+441534"},
                    {"label":"Jordan(+962)","value":"+962"},
                    {"label":"Kazakhstan(+7)","value":"+7"},
                    {"label":"Kenya(+254)","value":"+254"},
                    {"label":"Kiribati(+686)","value":"+686"},
                    {"label":"Kosovo(+383)","value":"+383"},
                    {"label":"Kuwait(+965)","value":"+965"},
                    {"label":"Kyrgyzstan(+996)","value":"+996"},
                    {"label":"Laos(+856)","value":"+856"},
                    {"label":"Latvia(+371)","value":"+371"},
                    {"label":"Lebanon(+961)","value":"+961"},
                    {"label":"Lesotho(+266)","value":"+266"},
                    {"label":"Liberia(+231)","value":"+231"},
                    {"label":"Libya(+218)","value":"+218"},
                    {"label":"Liechtenstein(+423)","value":"+423"},
                    {"label":"Lithuania(+370)","value":"+370"},
                    {"label":"Luxembourg(+352)","value":"+352"},
                    {"label":"Macao(+853)","value":"+853"},
                    {"label":"Macedonia(+389)","value":"+389"},
                    {"label":"Madagascar(+261)","value":"+261"},
                    {"label":"Malawi(+265)","value":"+265"},
                    {"label":"Malaysia(+60)","value":"+60"},
                    {"label":"Maldives(+960)","value":"+960"},
                    {"label":"Mali(+223)","value":"+223"},
                    {"label":"Malta(+356)","value":"+356"},
                    {"label":"Marshall Islands(+692)","value":"+692"},
                    {"label":"Mauritania(+222)","value":"+222"},
                    {"label":"Mauritius(+230)","value":"+230"},
                    {"label":"Mayotte(+262)","value":"+262"},
                    {"label":"Mexico(+52)","value":"+52"},
                    {"label":"Micronesia(+691)","value":"+691"},
                    {"label":"Moldova(+373)","value":"+373"},
                    {"label":"Monaco(+377)","value":"+377"},
                    {"label":"Mongolia(+976)","value":"+976"},
                    {"label":"Montenegro(+382)","value":"+382"},
                    {"label":"Montserrat(+1664)","value":"+1664"},
                    {"label":"Morocco(+212)","value":"+212"},
                    {"label":"Mozambique(+258)","value":"+258"},
                    {"label":"Myanmar(+95)","value":"+95"},
                    {"label":"Namibia(+264)","value":"+264"},
                    {"label":"Nauru(+674)","value":"+674"},
                    {"label":"Nepal(+977)","value":"+977"},
                    {"label":"Netherlands(+31)","value":"+31"},
                    {"label":"Netherlands Antilles(+599)","value":"+599"},
                    {"label":"New Caledonia(+687)","value":"+687"},
                    {"label":"New Zealand(+64)","value":"+64"},
                    {"label":"Nicaragua(+505)","value":"+505"},
                    {"label":"Niger(+227)","value":"+227"},
                    {"label":"Nigeria(+234)","value":"+234"},
                    {"label":"Niue(+683)","value":"+683"},
                    {"label":"North Korea(+850)","value":"+850"},
                    {"label":"Northern Mariana Islands(+1670)","value":"+1670"},
                    {"label":"Norway(+47)","value":"+47"},
                    {"label":"Oman(+968)","value":"+968"},
                    {"label":"Pakistan(+92)","value":"+92"},
                    {"label":"Palau(+680)","value":"+680"},
                    {"label":"Palestine(+970)","value":"+970"},
                    {"label":"Panama(+507)","value":"+507"},
                    {"label":"Papua New Guinea(+675)","value":"+675"},
                    {"label":"Paraguay(+595)","value":"+595"},
                    {"label":"Peru(+51)","value":"+51"},
                    {"label":"Philippines(+63)","value":"+63"},
                    {"label":"Pitcairn(+64)","value":"+64"},
                    {"label":"Poland(+48)","value":"+48"},
                    {"label":"Portugal(+351)","value":"+351"},
                    {"label":"Puerto Rico(+1787)","value":"+1787"},
                    {"label":"Qatar(+974)","value":"+974"},
                    {"label":"Republic of the Congo(+242)","value":"+242"},
                    {"label":"Reunion(+262)","value":"+262"},
                    {"label":"Romania(+40)","value":"+40"},
                    {"label":"Russia(+7)","value":"+7"},
                    {"label":"Rwanda(+250)","value":"+250"},
                    {"label":"Saint Barthelemy(+590)","value":"+590"},
                    {"label":"Saint Helena(+290)","value":"+290"},
                    {"label":"Saint Kitts and Nevis(+1869)","value":"+1869"},
                    {"label":"Saint Lucia(+1758)","value":"+1758"},
                    {"label":"Saint Martin(+590)","value":"+590"},
                    {"label":"Saint Pierre and Miquelon(+508)","value":"+508"},
                    {"label":"Saint Vincent and the Grenadines(+1784)","value":"+1784"},
                    {"label":"Samoa(+685)","value":"+685"},
                    {"label":"San Marino(+378)","value":"+378"},
                    {"label":"Sao Tome and Principe(+239)","value":"+239"},
                    {"label":"Saudi Arabia(+966)","value":"+966"},
                    {"label":"Senegal(+221)","value":"+221"},
                    {"label":"Serbia(+381)","value":"+381"},
                    {"label":"Seychelles(+248)","value":"+248"},
                    {"label":"Sierra Leone(+232)","value":"+232"},
                    {"label":"Singapore(+65)","value":"+65"},
                    {"label":"Sint Maarten(+1721)","value":"+1721"},
                    {"label":"Slovakia(+421)","value":"+421"},
                    {"label":"Slovenia(+386)","value":"+386"},
                    {"label":"Solomon Islands(+677)","value":"+677"},
                    {"label":"Somalia(+252)","value":"+252"},
                    {"label":"South Africa(+27)","value":"+27"},
                    {"label":"South Korea(+82)","value":"+82"},
                    {"label":"South Sudan(+211)","value":"+211"},
                    {"label":"Spain(+34)","value":"+34"},
                    {"label":"Sri Lanka(+94)","value":"+94"},
                    {"label":"Sudan(+249)","value":"+249"},
                    {"label":"Suriname(+597)","value":"+597"},
                    {"label":"Svalbard and Jan Mayen(+47)","value":"+47"},
                    {"label":"Swaziland(+268)","value":"+268"},
                    {"label":"Sweden(+46)","value":"+46"},
                    {"label":"Switzerland(+41)","value":"+41"},
                    {"label":"Syria(+963)","value":"+963"},
                    {"label":"Taiwan(+886)","value":"+886"},
                    {"label":"Tajikistan(+992)","value":"+992"},
                    {"label":"Tanzania(+255)","value":"+255"},
                    {"label":"Thailand(+66)","value":"+66"},
                    {"label":"Togo(+228)","value":"+228"},
                    {"label":"Tokelau(+690)","value":"+690"},
                    {"label":"Tonga(+676)","value":"+676"},
                    {"label":"Trinidad and Tobago(+1868)","value":"+1868"},
                    {"label":"Tunisia(+216)","value":"+216"},
                    {"label":"Turkey(+90)","value":"+90"},
                    {"label":"Turkmenistan(+993)","value":"+993"},
                    {"label":"Turks and Caicos Islands(+1649)","value":"+1649"},
                    {"label":"Tuvalu(+688)","value":"+688"},
                    {"label":"U.S. Virgin Islands(+1340)","value":"+1340"},
                    {"label":"Uganda(+256)","value":"+256"},
                    {"label":"Ukraine(+380)","value":"+380"},
                    {"label":"United Arab Emirates(+971)","value":"+971"},
                    {"label":"United Kingdom(+44)","value":"+44"},
                    {"label":"United States(+1)","value":"+1"},
                    {"label":"Uruguay(+598)","value":"+598"},
                    {"label":"Uzbekistan(+998)","value":"+998"},
                    {"label":"Vanuatu(+678)","value":"+678"},
                    {"label":"Vatican(+379)","value":"+379"},
                    {"label":"Venezuela(+58)","value":"+58"},
                    {"label":"Vietnam(+84)","value":"+84"},
                    {"label":"Wallis and Futuna(+681)","value":"+681"},
                    {"label":"Western Sahara(+212)","value":"+212"},
                    {"label":"Yemen(+967)","value":"+967"},
                    {"label":"Zambia(+260)","value":"+260"},
                    {"label":"Zimbabwe(+263)","value":"+263"}
                );
                self.countryCodes = new ArrayDataProvider(self.countryCodes, {
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

                self.genders = [
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' }
                ];
                self.genderSet = new ArrayDataProvider(self.genders, {
                    keyAttributes: 'value'
                });

                self.nationalities = ko.observableArray()
                self.nationalities.push(
                    {value: 'afghan', label: 'Afghan'},
                    {value: 'albanian', label: 'Albanian'},
                    {value: 'algerian', label: 'Algerian'},
                    {value: 'american', label: 'American'},
                    {value: 'andorran', label: 'Andorran'} ,
                    {value: 'angolan', label: 'Angolan'} ,
                    {value: 'anguillan', label: 'Anguillan'} ,
                    {value: 'citizen-of-antigua-and-barbuda', label: 'Citizen of Antigua and Barbuda'} ,
                    {value: 'argentine', label: 'Argentine'} ,
                    {value: 'armenianaustralian', label: 'ArmenianAustralian'},
                    {value: 'austrian', label: 'Austrian'},
                    {value: 'azerbaijani', label: 'Azerbaijani'},
                    {value: 'bahamian', label: 'Bahamian'},
                    {value: 'bahraini', label: 'Bahraini'},
                    {value: 'bangladeshi', label: 'Bangladeshi'},
                    {value: 'barbadian', label: 'Barbadian'},
                    {value: 'belarusian', label: 'Belarusian'},
                    {value: 'belgian', label: 'Belgian'},
                    {value: 'belizean', label: 'Belizean'},
                    {value: 'beninese', label: 'Beninese'},
                    {value: 'bermudian', label: 'Bermudian'},
                    {value: 'bhutanese', label: 'Bhutanese'},
                    {value: 'bolivian', label: 'Bolivian'},
                    {value: 'citizen-of-bosnia-and-herzegovina', label: 'Citizen of Bosnia and Herzegovina'},
                    {value: 'botswanan', label: 'Botswanan'},
                    {value: 'brazilian', label: 'Brazilian'},
                    {value: 'british', label: 'British'},
                    {value: 'british-virgin-islander', label: 'British Virgin Islander'},
                    {value: 'bruneian', label: 'Bruneian'},
                    {value: 'bulgarian', label: 'Bulgarian'},
                    {value: 'burkinan', label: 'Burkinan'},
                    {value: 'burmese', label: 'Burmese'},
                    {value: 'burundian', label: 'Burundian'},
                    {value: 'cambodian', label: 'Cambodian'},
                    {value: 'cameroonian', label: 'Cameroonian'},
                    {value: 'canadian', label: 'Canadian'},
                    {value: 'cape-verdean', label: 'Cape Verdean'},
                    {value: 'cayman-islander', label: 'Cayman Islander'},
                    {value: 'central-african', label: 'Central African'},
                    {value: 'chadian', label: 'Chadian'},
                    {value: 'chilean', label: 'Chilean'},
                    {value: 'chinese', label: 'Chinese'},
                    {value: 'colombian', label: 'Colombian'},
                    {value: 'comoran', label: 'Comoran'},
                    {value: 'congolese-(congo)', label: 'Congolese (Congo)'},
                    {value: 'congolese-(drc)', label: 'Congolese (DRC)'},
                    {value: 'cook-islander', label: 'Cook Islander'},
                    {value: 'costa-rican', label: 'Costa Rican'},
                    {value: 'croatian', label: 'Croatian'},
                    {value: 'cuban', label: 'Cuban'},
                    {value: 'cymraes', label: 'Cymraes'},
                    {value: 'cymro', label: 'Cymro'},
                    {value: 'cypriot', label: 'Cypriot'},
                    {value: 'czech', label: 'Czech'},
                    {value: 'danish', label: 'Danish'},
                    {value: 'djiboutian', label: 'Djiboutian'},
                    {value: 'dominican', label: 'Dominican'},
                    {value: 'citizen-of-the-dominican-republic', label: 'Citizen of the Dominican Republic'},
                    {value: 'dutch', label: 'Dutch'},
                    {value: 'east-timorese', label: 'East Timorese'},
                    {value: 'ecuadorean', label: 'Ecuadorean'},
                    {value: 'egyptian', label: 'Egyptian'},
                    {value: 'emirati', label: 'Emirati'},
                    {value: 'english', label: 'English'},
                    {value: 'equatorial-guinean', label: 'Equatorial Guinean'},
                    {value: 'eritrean', label: 'Eritrean'},
                    {value: 'estonian', label: 'Estonian'},
                    {value: 'ethiopian', label: 'Ethiopian'},
                    {value: 'faroese', label: 'Faroese'},
                    {value: 'fijian', label: 'Fijian'},
                    {value: 'filipino', label: 'Filipino'},
                    {value: 'finnish', label: 'Finnish'},
                    {value: 'french', label: 'French'},
                    {value: 'gabonese', label: 'Gabonese'},
                    {value: 'gambian', label: 'Gambian'},
                    {value: 'georgian', label: 'Georgian'},
                    {value: 'german', label: 'German'},
                    {value: 'ghanaian', label: 'Ghanaian'},
                    {value: 'gibraltarian', label: 'Gibraltarian'},
                    {value: 'greek', label: 'Greek'},
                    {value: 'greenlandic', label: 'Greenlandic'},
                    {value: 'grenadian', label: 'Grenadian'},
                    {value: 'guamanian', label: 'Guamanian'},
                    {value: 'guatemalan', label: 'Guatemalan'},
                    {value: 'citizen-of-guinea-bissau', label: 'Citizen of Guinea-Bissau'},
                    {value: 'guinean', label: 'Guinean'},
                    {value: 'guyanese', label: 'Guyanese'},
                    {value: 'haitian', label: 'Haitian'},
                    {value: 'honduran', label: 'Honduran'},
                    {value: 'hong-konger', label: 'Hong Konger'},
                    {value: 'hungarian', label: 'Hungarian'},
                    {value: 'icelandic', label: 'Icelandic'},
                    {value: 'indian', label: 'Indian'},
                    {value: 'indonesian', label: 'Indonesian'},
                    {value: 'iranian', label: 'Iranian'},
                    {value: 'iraqi', label: 'Iraqi'},
                    {value: 'irish', label: 'Irish'},
                    {value: 'israeli', label: 'Israeli'},
                    {value: 'italian', label: 'Italian'},
                    {value: 'ivorian', label: 'Ivorian'},
                    {value: 'jamaican', label: 'Jamaican'},
                    {value: 'japanese', label: 'Japanese'},
                    {value: 'jordanian', label: 'Jordanian'},
                    {value: 'kazakh', label: 'Kazakh'},
                    {value: 'kenyan', label: 'Kenyan'},
                    {value: 'kittitian', label: 'Kittitian'},
                    {value: 'citizen-of-kiribati', label: 'Citizen of Kiribati'},
                    {value: 'kosovan', label: 'Kosovan'},
                    {value: 'kuwaiti', label: 'Kuwaiti'},
                    {value: 'kyrgyz', label: 'Kyrgyz'},
                    {value: 'lao', label: 'Lao'},
                    {value: 'latvian', label: 'Latvian'},
                    {value: 'lebanese', label: 'Lebanese'},
                    {value: 'liberian', label: 'Liberian'},
                    {value: 'libyan', label: 'Libyan'},
                    {value: 'liechtenstein-citizen', label: 'Liechtenstein citizen'},
                    {value: 'lithuanian', label: 'Lithuanian'},
                    {value: 'luxembourger', label: 'Luxembourger'},
                    {value: 'macanese', label: 'Macanese'},
                    {value: 'macedonian', label: 'Macedonian'},
                    {value: 'malagasy', label: 'Malagasy'},
                    {value: 'malawian', label: 'Malawian'},
                    {value: 'malaysian', label: 'Malaysian'},
                    {value: 'maldivian', label: 'Maldivian'},
                    {value: 'malian', label: 'Malian'},
                    {value: 'maltese', label: 'Maltese'},
                    {value: 'marshallese', label: 'Marshallese'},
                    {value: 'martiniquais', label: 'Martiniquais'},
                    {value: 'mauritanian', label: 'Mauritanian'},
                    {value: 'mauritian', label: 'Mauritian'},
                    {value: 'mexican', label: 'Mexican'},
                    {value: 'micronesian', label: 'Micronesian'},
                    {value: 'moldovan', label: 'Moldovan'},
                    {value: 'monegasque', label: 'Monegasque'},
                    {value: 'mongolian', label: 'Mongolian'},
                    {value: 'montenegrin', label: 'Montenegrin'},
                    {value: 'montserratian', label: 'Montserratian'},
                    {value: 'moroccan', label: 'Moroccan'},
                    {value: 'mosotho', label: 'Mosotho'},
                    {value: 'mozambican', label: 'Mozambican'},
                    {value: 'namibian', label: 'Namibian'},
                    {value: 'nauruan', label: 'Nauruan'},
                    {value: 'nepalese', label: 'Nepalese'},
                    {value: 'new-zealander', label: 'New Zealander'},
                    {value: 'nicaraguan', label: 'Nicaraguan'},
                    {value: 'nigerian', label: 'Nigerian'},
                    {value: 'nigerien', label: 'Nigerien'},
                    {value: 'niuean', label: 'Niuean'},
                    {value: 'north-korean', label: 'North Korean'},
                    {value: 'northern-irish', label: 'Northern Irish'},
                    {value: 'norwegian', label: 'Norwegian'},
                    {value: 'omani', label: 'Omani'},
                    {value: 'pakistani', label: 'Pakistani'},
                    {value: 'palauan', label: 'Palauan'},
                    {value: 'palestinian', label: 'Palestinian'},
                    {value: 'panamanian', label: 'Panamanian'},
                    {value: 'papua-new-guinean', label: 'Papua New Guinean'},
                    {value: 'paraguayan', label: 'Paraguayan'},
                    {value: 'peruvian', label: 'Peruvian'},
                    {value: 'pitcairn-islander', label: 'Pitcairn Islander'},
                    {value: 'polish', label: 'Polish'},
                    {value: 'portuguese', label: 'Portuguese'},
                    {value: 'prydeinig', label: 'Prydeinig'},
                    {value: 'puerto-rican', label: 'Puerto Rican'},
                    {value: 'qatari', label: 'Qatari'},
                    {value: 'romanian', label: 'Romanian'},
                    {value: 'russian', label: 'Russian'},
                    {value: 'rwandan', label: 'Rwandan'},
                    {value: 'salvadorean', label: 'Salvadorean'},
                    {value: 'sammarinese', label: 'Sammarinese'},
                    {value: 'samoan', label: 'Samoan'},
                    {value: 'sao-tomean', label: 'Sao Tomean'},
                    {value: 'saudi-arabian', label: 'Saudi Arabian'},
                    {value: 'scottish', label: 'Scottish'},
                    {value: 'senegalese', label: 'Senegalese'},
                    {value: 'serbian', label: 'Serbian'},
                    {value: 'citizen-of-seychelles', label: 'Citizen of Seychelles'},
                    {value: 'sierra-leonean', label: 'Sierra Leonean'},
                    {value: 'singaporean', label: 'Singaporean'},
                    {value: 'slovak', label: 'Slovak'},
                    {value: 'slovenian', label: 'Slovenian'},
                    {value: 'solomon-islander', label: 'Solomon Islander'},
                    {value: 'somali', label: 'Somali'},
                    {value: 'south-african', label: 'South African'},
                    {value: 'south-korean', label: 'South Korean'},
                    {value: 'south-sudanese', label: 'South Sudanese'},
                    {value: 'spanish', label: 'Spanish'},
                    {value: 'sri-lankan', label: 'Sri Lankan'},
                    {value: 'st-helenian', label: 'St Helenian'},
                    {value: 'st-lucian', label: 'St Lucian'},
                    {value: 'stateless', label: 'Stateless'},
                    {value: 'sudanese', label: 'Sudanese'},
                    {value: 'surinamese', label: 'Surinamese'},
                    {value: 'swazi', label: 'Swazi'},
                    {value: 'swedish', label: 'Swedish'},
                    {value: 'swiss', label: 'Swiss'},
                    {value: 'syrian', label: 'Syrian'},
                    {value: 'taiwanese', label: 'Taiwanese'},
                    {value: 'tajik', label: 'Tajik'},
                    {value: 'tanzanian', label: 'Tanzanian'},
                    {value: 'thai', label: 'Thai'},
                    {value: 'togolese', label: 'Togolese'},
                    {value: 'tongan', label: 'Tongan'},
                    {value: 'trinidadian', label: 'Trinidadian'},
                    {value: 'tristanian', label: 'Tristanian'},
                    {value: 'tunisian', label: 'Tunisian'},
                    {value: 'turkish', label: 'Turkish'},
                    {value: 'turkmen', label: 'Turkmen'},
                    {value: 'turks-and-caicos-islander', label: 'Turks and Caicos Islander'},
                    {value: 'tuvaluan', label: 'Tuvaluan'},
                    {value: 'ugandan', label: 'Ugandan'},
                    {value: 'ukrainian', label: 'Ukrainian'},
                    {value: 'uruguayan', label: 'Uruguayan'},
                    {value: 'uzbek', label: 'Uzbek'},
                    {value: 'vatican-citizen', label: 'Vatican citizen'},
                    {value: 'citizen-of-vanuatu', label: 'Citizen of Vanuatu'},
                    {value: 'venezuelan', label: 'Venezuelan'},
                    {value: 'vietnamese', label: 'Vietnamese'},
                    {value: 'vincentian', label: 'Vincentian'},
                    {value: 'wallisian', label: 'Wallisian'},
                    {value: 'welsh', label: 'Welsh'},
                    {value: 'yemeni', label: 'Yemeni'},
                    {value: 'zambian', label: 'Zambian'},
                    {value: 'zimbabwean', label: 'Zimbabwean'}),
                self.nationalitySet = new ArrayDataProvider(self.nationalities, {
                    keyAttributes: 'value'
                });

                self.hearAbout = ko.observable();
                self.hearAbouties = ko.observableArray();
                self.hearAbouties.push(
                    {value: 'email', label: 'Email'},
                    {value: 'facebook', label: 'Facebook'} ,
                    {value: 'freinds', label: 'Friends'}, 
                    {value: 'family', label: 'Family'}, 
                    {value: 'google', label: 'Google'} ,
                    {value: 'hoardings', label: 'Hoardings'} ,
                    {value: 'instagram', label: 'Instagram'} ,
                    {value: 'IID', label: 'IID'} ,
                    {value: 'leaflet', label: 'Leaflet'},
                    {value: 'newsletter', label: 'Newsletter'},
                    {value: 'newspaper-advertisement', label: 'Newspaper Advertisement'},
                    {value: 'poster', label: 'Poster'},
                    {value: 'PID', label: 'PID'},
                    {value: 'radio-advertisement', label: 'Radio Advertisement'},
                    {value: 'registered-with-UAN', label: 'Registered with UAN'},
                    {value: 'UAN-website', label: 'UAN Website'},
                    {value: 'TV-advertisement', label: 'TV advertisement'},
                    {value: 'vehicle-branding', label: 'Vehicle Branding'},
                    {value: 'university-website', label: 'University Website'}
                )

                self.hearAboutSet = new ArrayDataProvider(self.hearAbouties, {
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

                self.country = ko.observable();

                self.countryChangeHandler = ()=>{
                    self.institutionList([])
                    $.ajax({
                        url: BaseURL+"/getInstitutionsName",
                        type: 'POST',
                        data: JSON.stringify({
                            institutionType: "",
                            country : self.country()
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

                self.office = ko.observable([])
                self.getOffices = (office)=>{
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
                                for(let i=0;i<len;i++){
                                    self.office().push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                                self.office1(`${office}`);
                            }
                        }
                    })
                }

                self.officeDp = new ArrayDataProvider(self.office(), {
                    keyAttributes: 'value'
                });

                self.statuses = [
                    { value: 'Lead', label: 'Lead' },
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' },
                    { value: 'SPAM', label: 'SPAM' },
                    { value: 'Offer Received', label: 'Offer Received' },
                    { value: 'Deposit Paid', label: 'Deposit Paid' },
                    { value: 'Visa Grant', label: 'Visa Grant' },
                    { value: 'Not Interested', label: 'Not Interested' },
                    { value: 'Rejected', label: 'Rejected' },
                    { value: 'Closed', label: 'Closed' }
                ];
                self.statusesSet = new ArrayDataProvider(self.statuses, {
                    keyAttributes: 'value'
                });

                self.subStatuses = [
                    { value: 'FC', label: 'First Counseling' },
                    { value: 'SC', label: 'Second Counseling' },
                    { value: 'AS', label: 'Application Sent' },
                    { value: 'OR', label: 'Offer Received' },
                ];
                self.subStatusesSet = new ArrayDataProvider(self.subStatuses, {
                    keyAttributes: 'value'
                });

                self.studyAbroadDestination = ko.observable();

                self.abroadDestionations = [
                    {"label":"UK","value":"UK"},
                    {"label":"Canada","value":"Canada"},
                    {"label":"USA","value":"USA"},
                    {"label":"Australia","value":"Australia"}
                ]

                self.abroadDestionationsDp = new ArrayDataProvider(self.abroadDestionations, {
                    keyAttributes: 'value'
                });

                self.currencies = [
                    {value: "Afghan Afghani", label: "AFA"},
                    {value: "Albanian Lek", label: "ALL"},
                    {value: "Algerian Dinar", label: "DZD"},
                    {value: "Angolan Kwanza", label: "AOA"},
                    {value: "Argentine Peso", label: "ARS"},
                    {value: "Armenian Dram", label: "AMD"},
                    {value: "Aruban Florin", label: "AWG"},
                    {value: "Australian Dollar", label: "AUD"},
                    {value: "Azerbaijani Manat", label: "AZN"},
                    {value: "Bahamian Dollar", label: "BSD"},
                    {value: "Bahraini Dinar", label: "BHD"},
                    {value: "Bangladeshi Taka", label: "BDT"},
                    {value: "Barbadian Dollar", label: "BBD"},
                    {value: "Belarusian Ruble", label: "BYR"},
                    {value: "Belgian Franc", label: "BEF"},
                    {value: "Belize Dollar", label: "BZD"},
                    {value: "Bermudan Dollar", label: "BMD"},
                    {value: "Bhutanese Ngultrum", label: "BTN"},
                    {value: "Bitcoin", label: "BTC"},
                    {value: "Bolivian Boliviano", label: "BOB"},
                    {value: "Bosnia-Herzegovina Convertible Mark", label: "BAM"},
                    {value: "Botswanan Pula", label: "BWP"},
                    {value: "Brazilian Real", label: "BRL"},
                    {value: "British Pound Sterling", label: "GBP"},
                    {value: "Brunei Dollar", label: "BND"},
                    {value: "Bulgarian Lev", label: "BGN"},
                    {value: "Burundian Franc", label: "BIF"},
                    {value: "Cambodian Riel", label: "KHR"},
                    {value: "Canadian Dollar", label: "CAD"},
                    {value: "Cape Verdean Escudo", label: "CVE"},
                    {value: "Cayman Islands Dollar", label: "KYD"},
                    {value: "CFA Franc BCEAO", label: "XOF"},
                    {value: "CFA Franc BEAC", label: "XAF"},
                    {value: "CFP Franc", label: "XPF"},
                    {value: "Chilean Peso", label: "CLP"},
                    {value: "Chilean Unit of Account", label: "CLF"},
                    {value: "Chinese Yuan", label: "CNY"},
                    {value: "Colombian Peso", label: "COP"},
                    {value: "Comorian Franc", label: "KMF"},
                    {value: "Congolese Franc", label: "CDF"},
                    {value: "Costa Rican Colón", label: "CRC"},
                    {value: "Croatian Kuna", label: "HRK"},
                    {value: "Cuban Convertible Peso", label: "CUC"},
                    {value: "Czech Republic Koruna", label: "CZK"},
                    {value: "Danish Krone", label: "DKK"},
                    {value: "Djiboutian Franc", label: "DJF"},
                    {value: "Dominican Peso", label: "DOP"},
                    {value: "East Caribbean Dollar", label: "XCD"},
                    {value: "Egyptian Pound", label: "EGP"},
                    {value: "Eritrean Nakfa", label: "ERN"},
                    {value: "Estonian Kroon", label: "EEK"},
                    {value: "Ethiopian Birr", label: "ETB"},
                    {value: "Euro", label: "EUR"},
                    {value: "Falkland Islands Pound", label: "FKP"},
                    {value: "Fijian Dollar", label: "FJD"},
                    {value: "Gambian Dalasi", label: "GMD"},
                    {value: "Georgian Lari", label: "GEL"},
                    {value: "German Mark", label: "DEM"},
                    {value: "Ghanaian Cedi", label: "GHS"},
                    {value: "Gibraltar Pound", label: "GIP"},
                    {value: "Greek Drachma", label: "GRD"},
                    {value: "Guatemalan Quetzal", label: "GTQ"},
                    {value: "Guinean Franc", label: "GNF"},
                    {value: "Guyanaese Dollar", label: "GYD"},
                    {value: "Haitian Gourde", label: "HTG"},
                    {value: "Honduran Lempira", label: "HNL"},
                    {value: "Hong Kong Dollar", label: "HKD"},
                    {value: "Hungarian Forint", label: "HUF"},
                    {value: "Icelandic Króna", label: "ISK"},
                    {value: "Indian Rupee", label: "INR"},
                    {value: "Indonesian Rupiah", label: "IDR"},
                    {value: "Iranian Rial", label: "IRR"},
                    {value: "Iraqi Dinar", label: "IQD"},
                    {value: "Israeli New Sheqel", label: "ILS"},
                    {value: "Italian Lira", label: "ITL"},
                    {value: "Jamaican Dollar", label: "JMD"},
                    {value: "Japanese Yen", label: "JPY"},
                    {value: "Jordanian Dinar", label: "JOD"},
                    {value: "Kazakhstani Tenge", label: "KZT"},
                    {value: "Kenyan Shilling", label: "KES"},
                    {value: "Kuwaiti Dinar", label: "KWD"},
                    {value: "Kyrgystani Som", label: "KGS"},
                    {value: "Laotian Kip", label: "LAK"},
                    {value: "Latvian Lats", label: "LVL"},
                    {value: "Lebanese Pound", label: "LBP"},
                    {value: "Lesotho Loti", label: "LSL"},
                    {value: "Liberian Dollar", label: "LRD"},
                    {value: "Libyan Dinar", label: "LYD"},
                    {value: "Litecoin", label: "LTC"},
                    {value: "Lithuanian Litas", label: "LTL"},
                    {value: "Macanese Pataca", label: "MOP"},
                    {value: "Macedonian Denar", label: "MKD"},
                    {value: "Malagasy Ariary", label: "MGA"},
                    {value: "Malawian Kwacha", label: "MWK"},
                    {value: "Malaysian Ringgit", label: "MYR"},
                    {value: "Maldivian Rufiyaa", label: "MVR"},
                    {value: "Mauritanian Ouguiya", label: "MRO"},
                    {value: "Mauritian Rupee", label: "MUR"},
                    {value: "Mexican Peso", label: "MXN"},
                    {value: "Moldovan Leu", label: "MDL"},
                    {value: "Mongolian Tugrik", label: "MNT"},
                    {value: "Moroccan Dirham", label: "MAD"},
                    {value: "Mozambican Metical", label: "MZM"},
                    {value: "Myanmar Kyat", label: "MMK"},
                    {value: "Namibian Dollar", label: "NAD"},
                    {value: "Nepalese Rupee", label: "NPR"},
                    {value: "Netherlands Antillean Guilder", label: "ANG"},
                    {value: "New Taiwan Dollar", label: "TWD"},
                    {value: "New Zealand Dollar", label: "NZD"},
                    {value: "Nicaraguan Córdoba", label: "NIO"},
                    {value: "Nigerian Naira", label: "NGN"},
                    {value: "North Korean Won", label: "KPW"},
                    {value: "Norwegian Krone", label: "NOK"},
                    {value: "Omani Rial", label: "OMR"},
                    {value: "Pakistani Rupee", label: "PKR"},
                    {value: "Panamanian Balboa", label: "PAB"},
                    {value: "Papua New Guinean Kina", label: "PGK"},
                    {value: "Paraguayan Guarani", label: "PYG"},
                    {value: "Peruvian Nuevo Sol", label: "PEN"},
                    {value: "Philippine Peso", label: "PHP"},
                    {value: "Polish Zloty", label: "PLN"},
                    {value: "Qatari Rial", label: "QAR"},
                    {value: "Romanian Leu", label: "RON"},
                    {value: "Russian Ruble", label: "RUB"},
                    {value: "Rwandan Franc", label: "RWF"},
                    {value: "Salvadoran Colón", label: "SVC"},
                    {value: "Samoan Tala", label: "WST"},
                    {value: "São Tomé and Príncipe Dobra", label: "STD"},
                    {value: "Saudi Riyal", label: "SAR"},
                    {value: "Serbian Dinar", label: "RSD"},
                    {value: "Seychellois Rupee", label: "SCR"},
                    {value: "Sierra Leonean Leone", label: "SLL"},
                    {value: "Singapore Dollar", label: "SGD"},
                    {value: "Slovak Koruna", label: "SKK"},
                    {value: "Solomon Islands Dollar", label: "SBD"},
                    {value: "Somali Shilling", label: "SOS"},
                    {value: "South African Rand", label: "ZAR"},
                    {value: "South Korean Won", label: "KRW"},
                    {value: "South Sudanese Pound", label: "SSP"},
                    {value: "Special Drawing Rights", label: "XDR"},
                    {value: "Sri Lankan Rupee", label: "LKR"},
                    {value: "St. Helena Pound", label: "SHP"},
                    {value: "Sudanese Pound", label: "SDG"},
                    {value: "Surivaluese Dollar", label: "SRD"},
                    {value: "Swazi Lilangeni", label: "SZL"},
                    {value: "Swedish Krona", label: "SEK"},
                    {value: "Swiss Franc", label: "CHF"},
                    {value: "Syrian Pound", label: "SYP"},
                    {value: "Tajikistani Somoni", label: "TJS"},
                    {value: "Tanzanian Shilling", label: "TZS"},
                    {value: "Thai Baht", label: "THB"},
                    {value: "Tongan Pa'anga", label: "TOP"},
                    {value: "Trinidad & Tobago Dollar", label: "TTD"},
                    {value: "Tunisian Dinar", label: "TND"},
                    {value: "Turkish Lira", label: "TRY"},
                    {value: "Turkmenistani Manat", label: "TMT"},
                    {value: "Ugandan Shilling", label: "UGX"},
                    {value: "Ukrainian Hryvnia", label: "UAH"},
                    {value: "United Arab Emirates Dirham", label: "AED"},
                    {value: "Uruguayan Peso", label: "UYU"},
                    {value: "US Dollar", label: "USD"},
                    {value: "Uzbekistan Som", label: "UZS"},
                    {value: "Vanuatu Vatu", label: "VUV"},
                    {value: "Venezuelan BolÃvar", label: "VEF"},
                    {value: "Vietvaluese Dong", label: "VND"},
                    {value: "Yemeni Rial", label: "YER"},
                    {value: "Zambian Kwacha", label: "ZMK"},
                    {value: "Zimbabwean dollar", label: "ZWL"}
                ];
                self.currenciesSet = new ArrayDataProvider(self.currencies, {
                    keyAttributes: 'value'
                });
                self.tutionFeeCurrency = ko.observable("");
                self.depositCurrency = ko.observable("");

                self.years = ko.observable();
                const currentYear = new Date().getFullYear();
                const years = [];
                for (let year = currentYear+1; year < currentYear+5; year++) {
                    var monthValue1 = "Jan/Feb/Mar "+year;
                    var monthValue2 = "Apr/May/June "+year;
                    var monthValue3 = "Sep/Oct/Nov "+year;
                    years.push({ value: `${monthValue1}`, label: `${monthValue1}`})
                    years.push({ value: `${monthValue2}`, label: `${monthValue3}`})
                    years.push({ value: `${monthValue3}`, label: `${monthValue3}`})
                }
                self.years(years);
                self.yearsDp = new ArrayDataProvider(self.years(), {
                    keyAttributes: 'value'
                });


                self.getStudent = (studentId)=>{
                    $.ajax({
                        url: BaseURL+"/searchStudents",
                        type: 'POST',
                        data: JSON.stringify({
                            studentId: studentId
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                self.firstName(data[0][3]);
                                self.lastName(data[0][4]);
                                self.countryCode(data[0][5])
                                self.mobileNumber(data[0][6]);
                                self.email(data[0][7]);
                                self.marketingSource(data[0][9]);
                                self.nationality(data[0][10]);
                                self.dob(data[0][11]);
                                self.status(data[0][12]);
                                var date = data[0][13];
                                date = new Date(date);
                                var year = date.getFullYear();
                                var month = ('0' + (date.getMonth() + 1)).slice(-2);
                                var day = ('0' + date.getDate()).slice(-2);
                                date =  `${day}-${month}-${year}`
                                self.enquiryDate(date);
                                self.gender(data[0][14]);
                                self.enquiryAbout(data[0][15]);
                                self.euStatus(data[0][16]);
                                self.countryBirth(data[0][17]);
                                self.subStatus(data[0][18]);
                                self.getOffices(data[0][2]);
                                self.studyAbroadDestination(data[0][19]);
                                self.yearIntake(data[0][20])
                                self.utmSource(data[0][21]);
                                self.utmMedium(data[0][22]);
                                self.utmCampaign(data[0][23]);
                                self.hearAbout(data[0][24]);
                                self.partner(data[0][25]);
                                if(data[0][1]==null){
                                    self.getCounselors(data[0][2], "");
                                    self.partners(data[0][2]);
                                }
                                else{
                                    self.getCounselors(data[0][2], data[0][1]);
                                    self.partners(data[0][2]);
                                }
                            }
                            else{
                                let popUp = document.getElementById("Message")
                                popUp.open()
                                
                            }
                        }
                    })
                }
                self.getStudent(studentId);

                self.redirectStudentsPage = ()=>{
                    self.router.go({path : 'students'});
                }

                //Oj train details//
                self.createTrainObservableArray = function (trainName) {
                    return [
                        { label: 'Personal Details', id: '1' + '-' + trainName },
                        { label: 'Applications', id: '2' + '-' + trainName },
                    ];
                };       
                self.selectedStep2 = ko.observable('stp1');
                self.stepArray2 = ko.observableArray([
                    { label: 'Personal Details', id: 'stp1' },
                    { label: 'Applications', id: 'stp2' }
                ]);

                self.update2 = (event) => {
                    var train = document.getElementById('train2');
                    let selectedStep2 = train.getStep(event.detail.value);
                    if (selectedStep2.id == "stp1") {
                        let personalDiv = document.getElementById("personalInfo");
                        let applicationDiv = document.getElementById("application");
                        applicationDiv.style.display = "none"
                        personalDiv.style.display = "block"
                    }
                    else{
                        let personalDiv = document.getElementById("personalInfo");
                        let applicationDiv = document.getElementById("application");
                        applicationDiv.style.display = "block"
                        personalDiv.style.display = "none"
                    }
                };

                //form functions
                self.personalUpdate = ()=>{
                    let popup = document.getElementById("progressBar");
                    popup.open();
                    $.ajax({
                        url: BaseURL+"/personalUpdate",
                        type: 'POST',
                        data: JSON.stringify({
                            studentId: self.student(),
                            firstName: self.firstName(),
                            lastName: self.lastName(),
                            countryCode: self.countryCode(),
                            phone: self.mobileNumber(),
                            gender: self.gender(),
                            email: self.email(),
                            euStatus: self.euStatus(),
                            dob: self.dob(),
                            nationality: self.nationality(),
                            birthCountry: self.countryBirth(),
                            enquiryAbout: self.enquiryAbout(),
                            studyAbroadDestination: self.studyAbroadDestination(),
                            year: self.yearIntake(),
                            hearAbout: self.hearAbout(),
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            location.reload()
                        }
                    })
                }

                self.officeChangeHandler = ()=>{
                    self.getCounselors(self.office1(), "")
                    self.partners(self.office1())
                }
                self.counselors = ko.observableArray([])

                self.getCounselors = (officeId, counsilorId)=>{
                    self.counselors([]);
                    $.ajax({
                        url: BaseURL+"/getCounselors",
                        type: 'POST',
                        data: JSON.stringify({
                            office: officeId,
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
                                    self.counselors.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                                self.consultant(`${counsilorId}`);
                            }
                        }
                    })
                }
                
                self.counselorList = new ArrayDataProvider(self.counselors, {
                    keyAttributes: 'value'
                });

                self.statusUpdate = ()=>{
                    let popup = document.getElementById("progressBar");
                    popup.open();
                    if(self.consultant()==""){
                        self.consultant(null);
                    }
                    $.ajax({
                        url: BaseURL+"/statusUpdate",
                        type: 'POST',
                        data: JSON.stringify({
                            studentId: self.student(),
                            status: self.status(),
                            // subStatus: self.subStatus(),
                            office: self.office1(),
                            consultant: self.consultant(),
                            marketingSource: self.marketingSource(),
                            partner: self.partner()
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            location.reload()
                        }
                    })
                }

                self.addLog = ()=>{
                    let popup = document.getElementById("addLog");
                    popup.open();
                }

                self.contact = [
                    { value: 'Phone', label: 'Phone' },
                    { value: 'Email', label: 'Email' }
                ];
                self.contactTypeData = new ArrayDataProvider(self.contact, {
                    keyAttributes: 'value'
                });

                self.addLogCancel = ()=>{
                    let popup = document.getElementById("addLog");
                    popup.close();
                }
                self.reminderDate = ko.observable(null);

                self.submitNotes = ()=>{
                    const formValid = self._checkValidationGroup("formValidation"); 
                    if (formValid) {
                        let popup = document.getElementById("progressBar");
                        popup.open();
                        $.ajax({
                            url: BaseURL+"/addPartnerStudentNotes",
                            type: 'POST',
                            data: JSON.stringify({
                                studentId: self.student(),
                                partnerId: sessionStorage.getItem("userPartnerId"),
                                note: self.note(),
                                reminderDate: self.reminderDate(),
                                leadSource: self.leadSource(),
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                let popup = document.getElementById("progressBar");
                                popup.close();
                                self.getNotes()
                                self.addLogCancel()
                            }
                        })
                    }
                }

                self.studentsNoteData = ko.observableArray([]);
                self.studentsNoteDataprovider = new ArrayDataProvider(self.studentsNoteData, {
                    keyAttributes: 'id'
                });

                self.getNotes = ()=>{
                    self.studentsNoteData([]);
                    $.ajax({
                        url: BaseURL+"/getPartnerStudentNotes",
                        type: 'POST',
                        data: JSON.stringify({
                            studentId: self.student()
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!="No data found"){
                                data = JSON.parse(data);
                                var len = data.length;
                                for(var i=0;i<len;i++){
                                    var staff = ""
                                    if(data[i][0]==null){
                                        staff = "No Staff"
                                    }
                                    else{
                                        staff = data[i][0]
                                    }
                                    var date = data[i][4];                                    
                                    date = new Date(date);
                                    const currentDate = new Date();
                                    const dateR = new Date(data[i][4]);
                                    const millisecondsIn24Hours = 24 * 60 * 60 * 1000;
                                    const timeDifference = currentDate-dateR;
                                    var isComplete24Hours = timeDifference >= 0 && timeDifference <= millisecondsIn24Hours;
                                    var year = date.getFullYear();
                                    var month = ('0' + (date.getMonth() + 1)).slice(-2);
                                    var day = ('0' + date.getDate()).slice(-2);
                                    date =  `${day}-${month}-${year}`
                                    self.studentsNoteData.push({
                                        staffName: staff,
                                        note: data[i][1],
                                        contact_type: data[i][2],
                                        lead_source: data[i][3],
                                        date: date,
                                        status:data[i][5],
                                        reminderDate: data[i][6],
                                        noteId:data[i][7],
                                        complete24: isComplete24Hours
                                    });
                                }
                            }
                        }
                    })
                }
                self.getNotes();

                self.editContactType = ko.observable('')
                self.editLeadSource = ko.observable('')
                self.editNote = ko.observable('')
                self.editReminderDate = ko.observable('')
                self.editNoteId = ko.observable('')
                self.editLog = (e)=>{
                    let id = e.target.id;
                    self.editNoteId(id)
                    $.ajax({
                        url: BaseURL+"/getNote",
                        type: 'POST',
                        data: JSON.stringify({
                            noteId: id
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                self.editContactType(data[0][0])
                                self.editLeadSource(data[0][1])
                                self.editNote(data[0][2])
                                self.editReminderDate(data[0][3])
                                let popup = document.getElementById("editLog");
                                popup.open();
                            }
                        }
                    })

                }

                self.editLogCancel = ()=>{
                    let popup = document.getElementById("editLog");
                    popup.close();   
                }

                self.updateNotes = ()=>{
                    const formValid = self._checkValidationGroup("formValidation"); 
                    if (formValid) {
                        let popup = document.getElementById("progressBar");
                        popup.open();
                        $.ajax({
                            url: BaseURL+"/updateStudentNotes",
                            type: 'POST',
                            data: JSON.stringify({
                                note: self.editNote(),
                                reminderDate: self.editReminderDate(),
                                contactType: self.editContactType(),
                                leadSource: self.editLeadSource(),
                                noteId: self.editNoteId()
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                let popup = document.getElementById("progressBar");
                                popup.close();
                                self.getNotes()
                                self.editLogCancel()
                            }
                        })
                    }
                }

                self.logStatusChange = (e)=>{
                    let popup = document.getElementById("progressBar");
                    popup.open();
                    $.ajax({
                        url: BaseURL+"/updateReminderNoteStatus",
                        type: 'POST',
                        data: JSON.stringify({
                            noteId: e.target.id
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            console.log(data);
                            self.getNotes();
                            let popup = document.getElementById("progressBar");
                            popup.close();
                        }
                    })
                }

                //Application side 
                self.selectApplictn = ko.observable();
                self.addNewApplication = ()=>{
                    const formValid = self._checkValidationGroup("applicationValidation"); 
                    if (formValid) {
                        let popup = document.getElementById("progressBar");
                        popup.open();
                        if(self.ielts().length==0){
                            self.ielts([""])
                        }
                        if(self.courseEndDate()==""){
                            self.courseEndDate(null);
                        }
                        $.ajax({
                            url: BaseURL+"/addNewApplication",
                            type: 'POST',
                            data: JSON.stringify({
                                studentId: self.student(),
                                courseType: self.courseType(),
                                institutionName: self.institutionName(),
                                institutionId : self.institutionId(),
                                courseStartDate: self.courseStartDate(),
                                courseEndDate: self.courseEndDate(),
                                courseName: self.courseName(),
                                dateOfApplicationSent: self.applicationSentDate(),
                                partner: self.partner(),
                                tutionFeeCurrency : self.tutionFeeCurrency(),
                                tutionFee: self.tutionFee(),
                                loginUrl: self.loginUrl(),
                                username: self.userName(),
                                password: self.password(),
                                applicationMethod: self.applicationMethod(),
                                counsellingType: self.counsellingType(),
                                ielts: self.ielts()[0],
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(xhr);
                                console.log(textStatus);
                                console.log(errorThrown);
                            },
                            success: function (data) {
                                self.courseType('');
                                self.institutionName('');
                                self.institutionId('');
                                self.courseStartDate('');
                                self.courseName('');
                                self.courseEndDate('');
                                self.applicationSentDate('');
                                self.partner('');
                                self.tutionFeeCurrency('');
                                self.tutionFee(0);
                                self.loginUrl('');
                                self.userName('');
                                self.password('');
                                self.applicationMethod('');
                                self.counsellingType('');
                                self.ielts([]);
                                let popup = document.getElementById("progressBar");
                                popup.close();
                                self.getApplicationData();
                                self.getFinalChoicedData();
                                self.getStudent(self.student())
                            }
                        })
                    }
                }
                
                self.applicationData = ko.observableArray([]);
                self.applicationDataprovider = new ArrayDataProvider(self.applicationData, {
                    keyAttributes: 'id'
                });

                self.finalChoices = ko.observableArray([]);
                self.totalNumberOfApplication = ko.observable();
                self.getApplicationData = ()=>{
                    self.applicationData([]);
                    self.finalChoices([]);
                    $.ajax({
                        url: BaseURL+"/getApplicationData",
                        type: 'POST',
                        data: JSON.stringify({
                            studentId: self.student(),
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!="No data found"){
                                data = JSON.parse(data);
                                var len = data.length;
                                self.totalNumberOfApplication(len)
                                for(var i=0;i<len;i++){
                                    if(data[i][16]==0){
                                        self.finalChoices.push({value: `${data[i][0]}`, label: `${data[i][3]}`})
                                    }
                                    self.applicationData.push({
                                        no: i+1,
                                        id: data[i][0], 
                                        university: data[i][3], 
                                        coursename: data[i][6],
                                        coursetype: data[i][2],
                                        loginurl: data[i][10],
                                        username: data[i][11],
                                        password: data[i][12],
                                        courseStartDate: data[i][4],
                                        appSentDate: data[i][7],
                                        offerDecisionType: data[i][19],
                                        ref: data[i][20],
                                    })
                                }
                            }
                            else{
                                self.totalNumberOfApplication(0);
                            }
                        }
                    })
                }
                self.getApplicationData()

                self.goToPage = (event)=>{
                    let url = event.srcElement.id;
                    var file=url.replace(/\s/g,'%20');
                    document.getElementById(url).href = file;
                }

                self.partnerEdit = ko.observable("");
                self.tutionFeeCurrencyEdit = ko.observable("");
                self.tutionFeeEdit = ko.observable(0);
                self.applicationMethodEdit = ko.observable("");
                self.counsellingTypeEdit = ko.observable("");
                self.editApplicationId = ko.observable();
                self.universityEdit = ko.observable();
                
                self.instituteChangeEditHandler = (e)=>{
                    self.universityEdit(e.detail.itemContext.data.label);
                }
                self.institutionIdEdit = ko.observable();
                self.coursenameEdit = ko.observable();
                self.coursetypeEdit = ko.observable();
                self.loginurlEdit = ko.observable();
                self.usernameEdit = ko.observable();
                self.passwordEdit = ko.observable();
                self.courseStartDateEdit = ko.observable();
                self.courseEndDateEdit = ko.observable();
                self.applicationSentDateEdit = ko.observable();
                self.offerCreationDateEdit = ko.observable("");
                self.offerDecisionTypeEdit = ko.observable("");
                self.referenceNoEdit = ko.observable("");
                self.offerFileUpload = ko.observable("");
                self.depositAmountEdit = ko.observable(0);
                self.depositIsNotRequiredEdit = ko.observable([]);
                self.depositPaidDateEdit = ko.observable("");
                self.casIssuedEdit = ko.observable([]);
                self.visaAppliedDateEdit = ko.observable("");
                self.visaDecisionTypeEdit = ko.observable("");
                self.visaDecisionDateEdit = ko.observable("");
                self.ieltsEdit = ko.observable([]);
                self.offerFile = ko.observable("");
                

                self.decisionTypes = [
                    { value: 'Withdrawn', label: 'Withdrawn' },
                    { value: 'Unconditional', label: 'Unconditional' },
                    { value: 'Rejected', label: 'Rejected' },
                    { value: 'Conditional', label: 'Conditional' },
                    { value: 'Course Full', label: 'Course Full' },
                    { value: 'Awaiting Decision', label: 'Awaiting Decision' },
                    { value: 'Waiting List', label: 'Waiting List' }
                ];
                self.decisionTypeDp = new ArrayDataProvider(self.decisionTypes, {
                    keyAttributes: 'value'
                });

                self.visaDecisionTypes = [
                    { value: 'Approved', label: 'Approved' },
                    { value: 'Refused', label: 'Refused' }
                ];
                self.visaDecisionTypeDp = new ArrayDataProvider(self.visaDecisionTypes, {
                    keyAttributes: 'value'
                });
                
                self.offerFileMessage = ko.observable()
                self.selectListenButtonClick = ko.observable(false);

                self.selectListener = (event)=>{
                    let files = event.detail.files;
                    let popup = document.getElementById("progressBar");
                    popup.open();
                    // document.getE lementById("offerFile").disabled = true;
                    self.offerFile(
                        Array.prototype.map.call(files, function (file) {
                            var formData = new FormData();
                            formData.append("file", file);
                            $.ajax({
                                url:   BaseURL + "/offerFileUpload",
                                type: "POST",
                                data: formData,
                                cache: false,
                                contentType: false,
                                processData: false,
                                error: function (jqXHR, textStatus, errorThrown) {
                                    console.log(textStatus);
                                },
                                success: (data) => {
                                    console.log(data);
                                    var filename = file.name.replace(/\s/g, "_");
                                    self.offerFileUpload(filename);
                                    self.selectListenButtonClick = ko.observable(true);
                                }
                            });
                            return file.name;
                        })
                    );
                    popup.close();
                }
                
                self.offerFileUrl = ko.observable();

                self.editApplication = (event)=>{
                    self.selectListenButtonClick(false)
                    let applicationId = event.currentTarget.id
                    self.editApplicationId(applicationId);
                    $.ajax({
                        url: BaseURL+"/editApplication",
                        type: 'POST',
                        data: JSON.stringify({
                            applicationId: applicationId,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                console.log(data);
                                self.coursetypeEdit(data[0][2]);
                                self.universityEdit(data[0][3]);
                                self.institutionIdEdit(data[0][31]);
                                self.courseStartDateEdit(data[0][4]);
                                self.courseEndDateEdit(data[0][5]);
                                self.coursenameEdit(data[0][6]);
                                self.applicationSentDateEdit(data[0][7]);
                                self.partnerEdit(data[0][8]);
                                if(data[0][9]==""){
                                    self.tutionFeeEdit(0);
                                }
                                else{
                                    self.tutionFeeEdit(Number(data[0][9]));
                                }
                                self.loginurlEdit(data[0][10]);
                                self.usernameEdit(data[0][11]);
                                self.passwordEdit(data[0][12]);
                                self.applicationMethodEdit(data[0][13]);
                                self.counsellingTypeEdit(data[0][14])
                                if(data[0][15]!=""){
                                    self.ieltsEdit([data[0][15]]);
                                }
                                else{
                                    self.ieltsEdit([""]);
                                }
                                self.offerFileUpload(data[0][17]);
                                self.offerCreationDateEdit(data[0][18]);
                                self.offerDecisionTypeEdit(data[0][19]);
                                self.referenceNoEdit(data[0][20]);
                                self.tutionFeeCurrencyEdit(data[0][29]);
                                self.depositCurrency(data[0][30]);
                                self.depositAmountEdit(Number(data[0][21]));
                                if(data[0][22]!=""){
                                    self.depositIsNotRequiredEdit([data[0][22]]);
                                }
                                else{
                                    self.depositIsNotRequiredEdit([""]);
                                }
                                self.depositPaidDateEdit(data[0][23]);
                                if(data[0][24]!=""){
                                    self.casIssuedEdit([data[0][24]]);
                                }
                                else{
                                    self.casIssuedEdit([""]);
                                }
                                self.visaAppliedDateEdit(data[0][25]);
                                self.visaDecisionTypeEdit(data[0][26]);
                                self.visaDecisionDateEdit(data[0][27]);
                                if(data[0][17] === null || data[0][17] === ""){
                                    self.offerFile("");
                                }
                                else{
                                    // console.log(data[0][17]);
                                    self.offerFileUrl("");
                                    self.offerFile(data[0][17]);
                                }
                                
                                let popup = document.getElementById("applicationEdit");
                                popup.open();
                            }
                        }
                    })
                }

                self.waitText = ko.observable();

                self.updateApplication = (event)=>{
                    self.selectListenButtonClick(false)
                    let applicationId = event.currentTarget.id
                    self.waitText("Please wait....")
                    $.ajax({
                        url: BaseURL+"/applicationUpdate",
                        type: 'POST',
                        data: JSON.stringify({
                            applicationId: applicationId,
                            universityEdit: self.universityEdit(),
                            institutionId : self.institutionIdEdit(),
                            coursenameEdit: self.coursenameEdit(),
                            coursetypeEdit: self.coursetypeEdit(),
                            partner: self.partnerEdit(),
                            tutionFeeCurrency: self.tutionFeeCurrencyEdit(),
                            tutionFee: self.tutionFeeEdit(),
                            loginurlEdit: self.loginurlEdit(),
                            usernameEdit: self.usernameEdit(),
                            passwordEdit: self.passwordEdit(),
                            applicationMethod: self.applicationMethodEdit(),
                            counsellingType: self.counsellingTypeEdit(),
                            courseStartDateEdit: self.courseStartDateEdit(),
                            courseEndDateEdit: self.courseEndDateEdit(),
                            applicationSentDateEdit: self.applicationSentDateEdit(),
                            offerCreationDateEdit: self.offerCreationDateEdit(),
                            offerDecisionTypeEdit: self.offerDecisionTypeEdit(),
                            referenceNoEdit: self.referenceNoEdit(),
                            depositCurrency: self.depositCurrency(),
                            depositAmount: self.depositAmountEdit(),
                            depositIsNotRequired: self.depositIsNotRequiredEdit()[0],
                            depositPaidDate: self.depositPaidDateEdit(),
                            visaAppliedDate: self.visaAppliedDateEdit(),
                            visaDecisionType: self.visaDecisionTypeEdit(),
                            visaDecisionDate: self.visaDecisionDateEdit(),
                            casIssued: self.casIssuedEdit()[0],
                            ielts: self.ieltsEdit()[0],
                            offerFileUpload: self.offerFileUpload(),
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.waitText("");
                            self.getApplicationData();
                            self.getFinalChoicedData();
                            let popup = document.getElementById("applicationEdit");
                            popup.close();
                        }
                    })
                }

                self.removeFile = ()=>{
                    self.offerFile(null)
                    self.offerFileUpload(null)
                    document.getElementById("offerFileButton").style.display = "none";
                }

                self.previewClick = (event)=>{
                    if(self.selectListenButtonClick()){
                        self.offerFileMessage("Please Update")
                        setTimeout(()=>{
                            self.offerFileMessage("")
                            self.selectListenButtonClick(false)
                        },3000)
                    }
                    else{
                        let popup = document.getElementById("progressBar");
                        popup.open();
                        $.ajax({
                            url: BaseURL+"/getOfferFile",
                            type: 'POST',
                            data: JSON.stringify({
                                fileName : self.offerFile()
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                let popup = document.getElementById("progressBar");
                                popup.close();
                                var fileType = data[1]
                                var base64Code = data[0][0];
                                
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
                }

                self.checkItsFinalChoice = (applicationId)=>{
                    return new Promise(function(resolve, reject) {
                        $.ajax({
                            url: BaseURL+"/checkItsFinalChoice",
                            type: 'POST',
                            data: JSON.stringify({
                                applicationId: applicationId,
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                resolve(data)
                            }
                        })
                    })
                }

                self.deleteApplication = (event)=>{
                    let applicationId = event.currentTarget.id;
                    let popup = document.getElementById("progressBar");
                    popup.open();
                    self.checkItsFinalChoice(applicationId).then(function(result){
                        if(result[0][0][0]==0){
                            $.ajax({
                                url: BaseURL+"/deleteApplication",
                                type: 'POST',
                                data: JSON.stringify({
                                    applicationId: applicationId,
                                }),
                                dataType: 'json',
                                error: function (xhr, textStatus, errorThrown) {
                                    console.log(textStatus);
                                },
                                success: function (data) {
                                    self.getApplicationData();
                                }
                            })
                            let popup = document.getElementById("progressBar");
                            popup.close();
                        }
                        else{
                            let popup1 = document.getElementById("applicationDeleteMsg");
                            popup1.open();
                            let popup = document.getElementById("progressBar");
                            popup.close();
                        }
                    })
                }

                self.closeApplicationDeletePopUp = ()=>{
                    let popup1 = document.getElementById("applicationDeleteMsg");
                    popup1.close();
                }

                self.cancelListener = ()=>{
                    let popup = document.getElementById("applicationEdit");
                    popup.close();
                }


                self.finalChoiceDp = new ArrayDataProvider(self.finalChoices, {
                    keyAttributes: 'value'
                });

                self.selectApplictn = ko.observable();

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

                self.getFinalChoicedCount = (studentId)=>{
                    return new Promise(function(resolve, reject) {
                        $.ajax({
                            url: BaseURL+"/getStudentFinalChoicedCount",
                            type: 'POST',
                            data: JSON.stringify({
                                studentId: studentId,
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                resolve(data);
                            }
                        })
                    });
                }

                self.selectApplicationError = ko.observable()
                self.addFinalChoice = ()=>{
                    if(self.selectApplictn()==undefined || self.selectApplictn()==""){
                        self.selectApplicationError("Please select a application");
                        setTimeout(function() {
                            self.selectApplicationError("");    
                        }, 4000);
                    }
                    else{
                        let popup = document.getElementById("progressBar");
                        popup.open();
                        self.getFinalChoicedCount(self.student()).then(function(result){
                            if(result[0][0]>=3){
                                self.selectApplicationError("Only 3 applications can be in Final choice.");    
                                setTimeout(function() {
                                    self.selectApplicationError("");    
                                }, 4000);
                                let popup = document.getElementById("progressBar");
                                popup.close();
                            }
                            else{
                                $.ajax({
                                    url: BaseURL+"/addFinalChoice",
                                    type: 'POST',
                                    data: JSON.stringify({
                                        applicationId: self.selectApplictn(),
                                    }),
                                    dataType: 'json',
                                    error: function (xhr, textStatus, errorThrown) {
                                        console.log(textStatus);
                                    },
                                    success: function (data) {
                                        self.selectApplictn("")
                                        self.getFinalChoicedData()
                                        self.getApplicationData()
                                        let popup = document.getElementById("progressBar");
                                        popup.close();
                                    }
                                })
                            }
                        })
                    }
                }

                self.finalChoiceData = ko.observableArray([]);
                self.finalChoiceDataprovider = new ArrayDataProvider(self.finalChoiceData, {
                    keyAttributes: 'id'
                });

                self.getFinalChoicedData = ()=>{
                    self.finalChoiceData([]);
                    $.ajax({
                        url: BaseURL+"/getFinalChoicedData",
                        type: 'POST',
                        data: JSON.stringify({
                            studentId: self.student(),
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!="No data found"){
                                data = JSON.parse(data);
                                var len = data.length;
                                for(var i=0;i<len;i++){
                                    self.finalChoiceData.push({
                                        university: data[i][3], 
                                        courseName: data[i][6],
                                        courseType: data[i][2],
                                        courseStartDate: data[i][4],
                                        courseEndDate: data[i][5],
                                        TutionFee: data[i][9],
                                        TutionFeeCurrency: data[i][29],
                                        applicationId: data[i][0]
                                    })
                                }
                            }
                        }
                    })
                }
                self.getFinalChoicedData();

                self.deletePerson = ()=>{
                    let popup = document.getElementById("deleteMsg");
                    popup.open();
                }

                self.cancelDelete = ()=>{
                    let popup = document.getElementById("deleteMsg");
                    popup.close();
                }

                self.deleteConfirm = ()=>{
                    $.ajax({
                        url: BaseURL+"/deleteStudent",
                        type: 'POST',
                        data: JSON.stringify({
                            studentId: self.student(),
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.router.go({path : 'dashboard'});
                        }
                    })
                }
                
                self.removeFinalChoice = (e)=>{
                    let applicationId = e.currentTarget.id;
                    $.ajax({
                        url: BaseURL+"/removeFinalChoice",
                        type: 'POST',
                        data: JSON.stringify({
                            applicationId: applicationId,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.getFinalChoicedData()
                            self.getApplicationData()
                        }
                    })
                }

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
        return  StudentProfile;
    }
);