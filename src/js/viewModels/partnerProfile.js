define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojconverterutils-i18n", 
    "ojs/ojselectsingle", "ojs/ojswitcher", "ojs/ojformlayout", "ojs/ojinputtext", "ojs/ojdatetimepicker", "ojs/ojradioset", 
    "ojs/ojtable", "ojs/ojselectcombobox", "ojs/ojfilepicker", "ojs/ojinputnumber", "ojs/ojdatetimepicker", 
    "ojs/ojvalidationgroup", "ojs/ojcheckboxset"], 
    function (oj,ko,$, app, ArrayDataProvider, ojconverterutils_i18n_1) {

        class PartnerProfile {
            constructor(args) {
                var self = this;
                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL");

                self.partnerId = ko.observable();

                const tabData = [
                    { name: 'Details', id: 'details'},
                    { name: 'Applications', id: 'applications'},
                    { name: 'Final Choice', id: 'finalChoice'},
                    { name: 'Contract Files', id: 'contractFiles'},
                    { name: 'Add Logs', id: 'logs'},
                    { name: 'Credential', id: 'credential'},
                ];
                self.tabDataProvider = new ArrayDataProvider(tabData, { keyAttributes: 'id' });
                self.selectedItem = ko.observable("details");

                self.companyName = ko.observable("");
                self.companyWebsite = ko.observable("");
                self.directorFirstName = ko.observable("");
                self.directorLastName = ko.observable("");
                self.directorEmail = ko.observable("");
                self.directorEmailError = ko.observable("");
                self.directorContactNumber = ko.observable("");
                self.directorContactNumberError = ko.observable("");
                self.postalAddress = ko.observable("");
                self.city = ko.observable("");
                self.country = ko.observable("");
                self.bdm = ko.observable("");
                self.consultantAssigned = ko.observable("");
                self.contractDone = ko.observable("");
                self.processingOffice = ko.observable("");
                self.phoneValidator = (event)=>{
                    var phone = event.detail.value
                    if (phone > 31 && (phone < 48 || phone > 57) && phone.length==10){
                        self.directorContactNumberError('')
                    }else{
                        self.directorContactNumberError("Invalid phone number.");
                    }
                }

                self.emailPatternValidator = (event)=>{
                    var email = event.detail.value
                    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                    if(email.match(mailformat))
                    {
                        self.directorEmailError('')
                    }
                    else
                    {
                        self.directorEmailError("Should enter a valid email address.");
                    }   
                }

                self.countryCode = ko.observable("");
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

                self.offices = ko.observableArray([]);

                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const day = currentDate.getDate();
                self.applicationFromValue = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, 0, 1)));
                self.applicationToValue = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, month,day)));
                self.selectApplicationRadio = ko.observable("ASD");                
                self.applicationOffice = ko.observable();
                self.finalChoiceOffice = ko.observable()


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
                
                self.partner = ko.observable();
                self.partners = ko.observableArray([]);
                self.officesAll = ko.observableArray([]);
                self.applicationData = ko.observableArray();
                self.applicationBlob = ko.observable();
                self.applicationFileName = ko.observable();
                self.applicationYearData = ko.observableArray();

                self.finalChoiceData = ko.observableArray();
                self.finalChoiceBlob = ko.observable();
                self.finalChoiceFileName = ko.observable();
                
                self.editInvoiceNo = ko.observable();
                self.editInvoiceSent = ko.observable();
                self.editPaidToUs = ko.observable();
                self.editApplicationId = ko.observable();
                self.commissionRate = ko.observable();
                self.fileNames = ko.observableArray(new Array());

                self.partnerNote = ko.observable()
                self.partnerNoteData = ko.observableArray();
                self.partnerEmail = ko.observable('');
                self.password = ko.observable('');
                self.partnerName = ko.observable('');
                self.btnAction = ko.observable('');

                self.years = ko.observable();
                const currentYear = new Date().getFullYear();
                self.selectYear = ko.observable(currentYear.toString());

                if(sessionStorage.getItem("selectYear")==null || self.selectYear()==currentYear){
                    sessionStorage.setItem("selectYear", self.selectYear())
                }

                const years = [];
                for (let year = currentYear+2; year >= 2022; year--) {
                    years.push({ value: `${year}`, label: `${year}`})
                }
                self.years(years);
                self.yearsDp = new ArrayDataProvider(self.years(), {
                    keyAttributes: 'value'
                });

                self.currentYearRow = ko.observable();
                self.previousYearRow = ko.observable();
                self.percentageRow = ko.observable();

                self.yearChanged = ()=>{
                    self.getYearlyPartnerProfilePerformance();
                }

                self.studentsCount = ko.observable();
                self.applicationCount = ko.observable();
                self.finalchoicedCount = ko.observable();
                self.performancePartnerName = ko.observable();
                self.yearlyApplicationData = ko.observableArray();
                self.previousStudentCount = ko.observable();
                self.previousApplicationCount = ko.observable();
                self.previousFinalChoiceCount = ko.observable();
                self.percentageStudentCount = ko.observable();
                self.percentageApplicationCount = ko.observable();
                self.percentageFinalChoiceCount = ko.observable();

                self.getYearlyPartnerProfilePerformance = ()=>{
                    $.ajax({
                        url: BaseURL+"/getYearlyPartnerProfilePerformance",
                        type: 'POST',
                        data: JSON.stringify({
                            year: self.selectYear(),
                            partnerId : self.partnerId(),
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            console.log(data)

                        self.yearlyApplicationData([])
                        if(data !="No data found"){
                            data = JSON.parse(data);
                            console.log(data)
                            var studentCount = data[0][4]
                            var applicationCount = data[0][3]
                            var finalChoiceCount = data[0][5]
                            var previousStudentCount = data[0][7]
                            var previousApplicationCount = data[0][6]
                            var previousFinalChoiceCount = data[0][8]
                            var percentageStudentCount = data[0][10]
                            var percentageApplicationCount = data[0][9]
                            var percentageFinalChoiceCount = data[0][11]
                            var previousYear = self.selectYear() - 1;
                            self.performancePartnerName(data[0][1] + " " + data[0][2])
                            self.currentYearRow("Current Year" + " " + self.selectYear())
                            self.previousYearRow("Previous Year" + " " + previousYear)
                            self.percentageRow("% INC/DEC")
                            // Get a reference to the table component
                            var table = document.getElementById('table');

                            // Assuming you have a function to retrieve the dynamic header text for the first column
                            var dynamicHeaderText = self.performancePartnerName()

                            // Define the columns array with the dynamic header text for the first column
                            var dynamicColumns = [
                                {"headerText": dynamicHeaderText, "id": "partnerName"}, 
                                {"headerText": "Student", "id": "student"}, 
                                {"headerText": "Applications", "id": "applications"}, 
                                {"headerText": "FC", "id": "finalCheck"}
                            ];

                            // Set the columns array to the table
                            table.columns = dynamicColumns;
                         
                            
                            if(studentCount=="No data found"){
                                self.studentsCount(0)
                            }
                            else{
                                self.studentsCount(studentCount)
                            }
                            if(applicationCount=="No data found"){
                                self.applicationCount(0)
                            }
                            else{
                                self.applicationCount(applicationCount)
                            }
                            if(finalChoiceCount=="No data found"){
                                self.finalchoicedCount(0)
                            }
                            else{
                                self.finalchoicedCount(finalChoiceCount)
                            }

                                     
                            if(previousStudentCount=="No data found"){
                                self.previousStudentCount(0)
                            }
                            else{
                                self.previousStudentCount(previousStudentCount)
                            }
                            if(previousApplicationCount=="No data found"){
                                self.previousApplicationCount(0)
                            }
                            else{
                                self.previousApplicationCount(previousApplicationCount)
                            }
                            if(previousFinalChoiceCount=="No data found"){
                                self.previousFinalChoiceCount(0)
                            }
                            else{
                                self.previousFinalChoiceCount(previousFinalChoiceCount)
                            }


                            if(percentageStudentCount=="No data found" || percentageStudentCount== null){
                                self.percentageStudentCount(0 + "%")
                            }
                            else{
                                self.percentageStudentCount(percentageStudentCount+ "%")
                            }
                            if(percentageApplicationCount=="No data found" || percentageApplicationCount== null){
                                self.percentageApplicationCount(0 + "%")
                            }
                            else{
                                self.percentageApplicationCount(percentageApplicationCount + "%")
                            }
                            if(percentageFinalChoiceCount=="No data found" || percentageFinalChoiceCount== null){
                                self.percentageFinalChoiceCount(0 + "%")
                            }
                            else{
                                self.percentageFinalChoiceCount(percentageFinalChoiceCount+ "%")
                            }
                            self.yearlyApplicationData.push({
                                "performancePartnerName" : data[0][1] + " " + data[0][2],
                                "studentsCount" : data[0][4],
                                "applicationCount" : data[0][3],
                                "finalChoiceCount" : data[0][5],
                                "previousStudentCount" : data[0][7],
                                "previousApplicationCount" : data[0][6],
                                "previousFinalChoiceCount" : data[0][8]
                            });
                        }
                    }
                    })
                }

                self.yearlyApplicationDataprovider = new ArrayDataProvider(self.yearlyApplicationData, { keyAttributes: 'id' });


                self.getOffices = ()=>{
                    return new Promise((resolve, reject) => {
                        self.offices([])
                        $.ajax({
                            url: BaseURL+"/getOffices",
                            type: 'GET',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                if(data[0] != "No data found"){
                                    data = JSON.parse(data);
                                    self.offices([])
                                    let len = data.length;
                                    for(let i=0;i<len;i++){
                                        self.offices.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                    }
                                }
                            }
                        })
                        setTimeout(() => { resolve(); }, 1000);
                    });
                }
                self.officesList = new ArrayDataProvider(self.offices, {
                    keyAttributes: 'value'
                });

                self.officeChangeHandler = ()=>{
                    self.consultantAssigned("")
                    self.getCounselors(self.processingOffice())
                }

                self.bdmCounselors = ko.observableArray([])
                self.getBdmCounselors = ()=>{
                    return new Promise((resolve, reject) => {
                        self.bdmCounselors([])
                        $.ajax({
                            url: BaseURL+"/getUsers",
                            type: 'GET',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                if(data[0] != "No data found"){
                                    data = JSON.parse(data);
                                    self.bdmCounselors([])
                                    let len = data.length;
                                    for(let i=0;i<len;i++){
                                        if(data[i][1]!="Admin"){
                                            self.bdmCounselors.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                        }
                                    }
                                }
                            }
                        })
                        setTimeout(() => { resolve(); }, 1000);
                    });
                }
                self.bdmCounselorList = new ArrayDataProvider(self.bdmCounselors, {
                    keyAttributes: 'value'
                });

                self.counselors = ko.observableArray([])
                self.getCounselors = (officeId)=>{
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
                            }
                        }
                    })
                }
                self.counselorList = new ArrayDataProvider(self.counselors, {
                    keyAttributes: 'value'
                });

                self.partnerAfterUpdate = ()=>{
                    $.ajax({
                        url: BaseURL+"/getPartnerWithId",
                        type: 'POST',
                        data: JSON.stringify({
                            partnerId : self.partnerId(),
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                console.log(data)
                                self.companyName(data[0][1]);
                                self.companyWebsite(data[0][2]);
                                self.directorFirstName(data[0][3]);
                                self.directorLastName(data[0][4]);
                                self.directorEmail(data[0][5]);
                                self.countryCode(data[0][6]);
                                self.directorContactNumber(data[0][7]);
                                self.postalAddress(data[0][8]);
                                self.city(data[0][9]);
                                self.country(data[0][10]);
                                self.bdm(data[0][11]);
                                self.processingOffice(data[0][14]);
                                self.getCounselors(data[0][14])
                                self.consultantAssigned(data[0][12]);
                                self.contractDone(data[0][13]);
                                if(data[0][15]==null || data[0][15]==""){
                                    self.commissionRate(null);
                                }
                                else{
                                    let commissionRate = parseFloat(data[0][15], 10);
                                    self.commissionRate(commissionRate);
                                }
                            }
                        }
                    })
                }

                self.formUpdate = ()=>{
                    const formValid = self._checkValidationGroup("formValidation"); 
                    if (formValid) {
                        if(self.directorEmailError()=='' && self.directorContactNumberError()==''){
                            let popup = document.getElementById("progress");
                            popup.open();
                            $.ajax({
                                url: BaseURL+"/updatePartner",
                                type: 'POST',
                                data: JSON.stringify({
                                    partnerId: self.partnerId(),
                                    companyName: self.companyName(),
                                    companyWebsite: self.companyWebsite(),
                                    directorFirstName: self.directorFirstName(),
                                    directorLastName: self.directorLastName(),
                                    directorEmail: self.directorEmail(),
                                    countryCode: self.countryCode(),
                                    directorContactNumber: self.directorContactNumber(),
                                    postalAddress: self.postalAddress(),
                                    city: self.city(),
                                    country: self.country(),
                                    bdm: self.bdm(),
                                    consultantAssigned: self.consultantAssigned(),
                                    contractDone: self.contractDone(),
                                    processingOffice: self.processingOffice(),
                                    commissionRate : self.commissionRate()
                                }),
                                dataType: 'json',
                                timeout: sessionStorage.getItem("timeInetrval"),
                                context: self,
                                error: function (xhr, textStatus, errorThrown) {
                                    console.log(textStatus);
                                },
                                success: function (data) {
                                    let popup = document.getElementById("progress");
                                    popup.close();
                                    self.partnerAfterUpdate()
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

                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        app.onAppSuccess();
                        let partnerId = sessionStorage.getItem("partnerId")
                        if(partnerId){
                            self.partnerId(partnerId);
                            sessionStorage.removeItem("partnerId")
                            self.getOffices().then(()=>self.getYearlyPartnerProfilePerformance()).then(()=>self.getBdmCounselors()).then(()=>self.partnerAfterUpdate()).then(()=>self.getPartners()).then(()=>self.getPartnerContractFile()).then(()=>self.getPartnerNote()).then(()=>self.getPartnerInfo()).then(()=>self.getPartnerPassword()).catch(error => console.error(error))
                        }else{ 
                            self.getOffices();
                            self.getBdmCounselors();
                            self.getPartners(); 
                        }
                    }
                }

                self.getPartners = ()=>{
                    return new Promise((resolve, reject) => {
                        self.partners([])
                        $.ajax({
                            url: BaseURL+"/getPartners",
                            type: 'GET',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                if(data[0] != "No data found"){
                                    data = JSON.parse(data);
                                    self.partners([])
                                    let len = data.length;
                                    for(let i=0;i<len;i++){
                                        self.partners.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                    }
                                }
                            }
                        })
                        setTimeout(() => { resolve(); }, 1000);
                    });
                }

                self.officesAll.push({value: `All`, label: `All`})

                self.officesAllList = new ArrayDataProvider(self.officesAll, {
                    keyAttributes: 'value'
                });

                self.partnersList = new ArrayDataProvider(self.partners, {
                    keyAttributes: 'value'
                });

                self.parnerInfoGet = ()=>{
                    if(self.partnerId()==undefined){
                        document.getElementById("partnerRequireMessage").style.display = "block";
                        setTimeout(()=>{
                            document.getElementById("partnerRequireMessage").style.display = "none";
                        }, 5000);
                    }else{
                        self.applicationData([]);
                        self.partnerAfterUpdate();
                        self.getPartnerContractFile(); 
                        self.getPartnerNote(); 
                        self.getPartnerInfo(); 
                        self.getPartnerPassword();
                        self.getYearlyPartnerProfilePerformance();
                    }
                }

                self.viewApplications = ()=>{
                        self.showApplicationYearData()
                        if(self.partnerId()==undefined){
                            document.getElementById("partnerSelectMessage").style.display = "block";
                            setTimeout(()=>{
                                document.getElementById("partnerSelectMessage").style.display = "none";
                            }, 5000);
                        }else{
                        self.applicationOffice(['All'])
                        let fromDate = self.applicationFromValue()
                        let toDate = self.applicationToValue();
                        let office = self.applicationOffice();
                        office = office.join(",");
                        let radio = self.selectApplicationRadio();
                        self.applicationData([]);
                        let popup = document.getElementById("progress");
                        popup.open();
                        let dataUrl = "/getApplicationsPartnerASDReport"
                        if(radio=="CSD"){
                            dataUrl = "/getApplicationsPartnerCSDReport"   
                        }
                        $.ajax({
                            url: BaseURL+dataUrl,
                            type: 'POST',
                            data: JSON.stringify({
                                partnerId:self.partnerId(),
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

                self.showApplicationYearData = ()=>{
                    self.applicationOffice(['All'])
                    let fromDate = self.applicationFromValue()
                    let toDate = self.applicationToValue();
                    let office = self.applicationOffice();
                    office = office.join(",");
                    let radio = self.selectApplicationRadio();
                    self.applicationData([]);
                    let dataUrl = "/getApplicationsPartnerYearCountASDReport"
                    if(radio=="CSD"){
                        dataUrl = "/getApplicationsPartnerYearCountCSDReport"   
                    }
                    self.applicationYearData([])
                    $.ajax({
                        url: BaseURL+dataUrl,
                        type: 'POST',
                        data: JSON.stringify({
                            partnerId:self.partnerId(),
                            fromDate: fromDate,
                            toDate: toDate,
                            officeId: office,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            console.log(data)
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

                self.viewFinalChoices = ()=>{
                    if(self.partnerId()==undefined){
                        document.getElementById("parnerFinalMessage").style.display = "block";
                        setTimeout(()=>{
                            document.getElementById("parnerFinalMessage").style.display = "none";
                        }, 5000);
                    }else{
                    self.getCourseTypeFinalChoiceCount()
                        self.finalChoiceOffice(['All'])
                        let fromDate = self.finalChoiceFromValue()
                        let toDate = self.finalChoiceToValue();
                        let office = self.finalChoiceOffice();
                        office = office.join(",");
                        let radio = self.selectFinalChoiceRadio();
                        let popup = document.getElementById("progress");
                        popup.open();
                        let dataUrl = "/getFinalChoicesPartnerASDReport"
                        if(radio=="CSD"){
                            dataUrl = "/getFinalChoicessPartnerCSDReport"   
                        }
                        self.finalChoiceData([])
                        $.ajax({
                            url: BaseURL+dataUrl,
                            type: 'POST',
                            data: JSON.stringify({
                                partnerId:self.partnerId(),
                                fromDate: fromDate,
                                toDate: toDate,
                                officeId: office,
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                console.log(data)
                                var csvContent = '';
                                var headers = ['Student Id', 'Name', 'Email', 'Nationality', 'Office', 'Course Type', 'Course', 'Staff',
                                            'Course Start Date', 'Tution Fee', 'Commission', 'Total Commission', 'UTM Source', 'UTM Medium', 'UTM Campaign', 
                                            'Lead Source'];
                                csvContent += headers.join(',') + '\n';
                                if(data[0]!='No data found'){
                                    data = JSON.parse(data);
                                    let len = data.length;
                                    console.log(data)
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


                self.getCourseTypeFinalChoiceCount = ()=>{
                    self.finalChoiceOffice(['All'])
                    let fromDate = self.finalChoiceFromValue()
                    let toDate = self.finalChoiceToValue();
                    let office = self.finalChoiceOffice();
                    office = office.join(",");
                    let radio = self.selectFinalChoiceRadio();
                    let dataUrl = "/getFinalChoicesPartnerCourseTypeASDCount"
                    if(radio=="CSD"){
                        dataUrl = "/getFinalChoicesPartnerCourseTypeCSDCount"   
                    }
                    $.ajax({
                        url: BaseURL+dataUrl,
                        type: 'POST',
                        data: JSON.stringify({
                            partnerId:self.partnerId(),
                            fromDate: fromDate,
                            toDate: toDate,
                            officeId: office,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            console.log(data)
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

                self.editInvoiceDetails = (e)=>{
                    console.log(e)
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
                                console.log(data)
                                self.viewFinalChoices();
                                let editInvoice = document.getElementById("editInvoice");
                                editInvoice.close();
                            }
                        })
                    }
                }

                self.downloadApplicationData = ()=>{
                        self.showApplicationYearData()
                        if(self.partnerId()==undefined){
                            document.getElementById("partnerSelectMessage").style.display = "block";
                            setTimeout(()=>{
                                document.getElementById("partnerSelectMessage").style.display = "none";
                            }, 5000);
                        }else{
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
                }

                self.exportFinalChoices = ()=>{
                    if(self.partnerId()==undefined){
                        document.getElementById("parnerFinalMessage").style.display = "block";
                        setTimeout(()=>{
                            document.getElementById("parnerFinalMessage").style.display = "none";
                        }, 5000);
                    }else{
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
            }

            self.selectListener = (event) => {
                const files = event.detail.files;
                if(self.partnerId()=="" || self.partnerId()==undefined){
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
                        formData.append("partnerId", self.partnerId())
                        $.ajax({
                            url:   BaseURL + "/partnerContractFileUpload",
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

            self.previewClick = (e)=>{
                let popup = document.getElementById("progress");
                popup.open();
                $.ajax({
                    url: BaseURL+"/getPartnerContractFile",
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
                    url: BaseURL+"/updatePartnerContractFiles",
                    type: 'POST',
                    data: JSON.stringify({
                        partnerId:self.partnerId(),
                        contractFiles : contractFiles,
                    }),
                    dataType: 'json',
                    error: function (xhr, textStatus, errorThrown) {
                        console.log(textStatus);
                    },
                    success: function (data) {
                        self.getPartnerContractFile()
                    }
                })
            }
            
            self.getPartnerContractFile = ()=>{
                $.ajax({
                    url: BaseURL+"/getPartnerContractFileList",
                    type: 'POST',
                    data: JSON.stringify({
                        partnerId:self.partnerId(),
                    }),
                    dataType: 'json',
                    error: function (xhr, textStatus, errorThrown) {
                        console.log(textStatus);
                    },
                    success: function (data) {
                        console.log(data)
                        let popup = document.getElementById("progress");
                        popup.close();
                        if(data[0] != "No data found"){
                            data = JSON.parse(data);
                            let len = data.length;
                            self.fileNames([])
                            for(let i=0;i<len;i++){
                                if(data[i][1]!=null){
                                    var filesArray = data[i][1].split(',');
                                    let l = filesArray.length;
                                 /*    for(let j=0;j<l;j++){
                                        self.fileNames.push({"no": j+1, "file" :filesArray[j]});
                                    } */
                                    // desc list
                                    for (let j = l - 1; j >= 0; j--) {
                                        self.fileNames.push({"no": l - j, "file": filesArray[j]});
                                    }
                                }
                            }
                        }
                    }
                })
            }

            self.fileDataProvider = new ArrayDataProvider(self.fileNames, {
                keyAttributes: 'id'
            });


            self.getPartnerNote = ()=>{
                self.partnerNoteData([])
                $.ajax({
                    url: BaseURL+"/getPartnerNotes",
                    type: 'POST',
                    data: JSON.stringify({
                        partnerId:self.partnerId(),
                    }),
                    dataType: 'json',
                    error: function (xhr, textStatus, errorThrown) {
                        console.log(textStatus);
                    },
                    success: function (data) {
                        if(data[0]!='No data found'){
                            data = JSON.parse(data);
                            console.log(data)
                            let len = data.length;
                            for(let i=0;i<len;i++){
                                var date = data[i][2];                                    
                                date = new Date(date);
                                var year = date.getFullYear();
                                var month = ('0' + (date.getMonth() + 1)).slice(-2);
                                var day = ('0' + date.getDate()).slice(-2);
                                date =  `${day}-${month}-${year}`
                                self.partnerNoteData.push({
                                    "staffName" : data[i][0],
                                    "note" : data[i][1],
                                    "date" : date,
                                    "noteId" : data[i][3]
                                })
                            }
                        }
                    }
                })
            }

            self.partnerNoteDataProvider = new ArrayDataProvider(self.partnerNoteData, { keyAttributes: 'id' });

            self.addPartnerLog = ()=>{
                if(self.partnerId()==undefined){
                    document.getElementById("partnerLogMessage").style.display = "block";
                    setTimeout(()=>{
                        document.getElementById("partnerLogMessage").style.display = "none";
                    }, 5000);
                }else{
                    let popup = document.getElementById("addLog");
                    popup.open();
                    self.partnerNote('')
                 }
            }
            
            self.addLogCancel = ()=>{
                let popup = document.getElementById("addLog");
                popup.close();
            }

            self.submitNotes = ()=>{
                    const formValid = self._checkValidationGroup("logFormValidation"); 
                    if (formValid) {
                        let popup = document.getElementById("progress");
                        popup.open();
                        $.ajax({
                            url: BaseURL+"/addPartnerNotes",
                            type: 'POST',
                            data: JSON.stringify({
                                staffId : sessionStorage.getItem("userId"),
                                note : self.partnerNote(),
                                partnerId : self.partnerId()
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                console.log(data)
                                let popup = document.getElementById("progress");
                                popup.close();
                                self.addLogCancel()
                                self.partnerNote('')
                                self.getPartnerNote()
                            }
                        })
                    }
            }

            self.deleteLog = (e)=>{
                let id = e.target.id;
                let popup = document.getElementById("progress");
                popup.open();
                $.ajax({
                    url: BaseURL+"/deletePartnerNote",
                    type: 'POST',
                    data: JSON.stringify({
                        partnerNoteId : id
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
                        self.partnerNote(''),
                        self.getPartnerNote()
                    }
                })
            }

            self.getPartnerInfo = ()=>{
                $.ajax({
                    url: BaseURL+"/getPartnerWithId",
                    type: 'POST',
                    data: JSON.stringify({
                        partnerId:self.partnerId(),
                    }),
                    dataType: 'json',
                    error: function (xhr, textStatus, errorThrown) {
                        console.log(textStatus);
                    },
                    success: function (data) {
                        data = JSON.parse(data);
                        console.log(data)
                        self.partnerName(data[0][3] + " " + data[0][4]);
                        self.partnerEmail(data[0][5]);
                    }
                })
            }

            self.generatePassword = (length) =>{
                const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]\;?><,./-=1234567890';
                let password = '';
                
                for (let i = 0; i < length; i++) {
                  const randomIndex = Math.floor(Math.random() * charset.length);
                  password += charset[randomIndex];
                }
                
                self.password(password)
            }

            self.addUser = ()=>{
                if(self.partnerId()==undefined){
                    document.getElementById("partnerCredentialMessage").style.display = "block";
                    setTimeout(()=>{
                        document.getElementById("partnerCredentialMessage").style.display = "none";
                    }, 5000);
                }else{
                    const credentialFormValid = self._checkValidationGroup("credentialValidation"); 
                    if(credentialFormValid && self.partnerEmail() != ''){
                            let popup = document.getElementById("progress");
                            popup.open();
                            $.ajax({
                                url: BaseURL+"/addUser",
                                type: 'POST',
                                data: JSON.stringify({
                                    name : self.partnerName(),
                                    office : self.processingOffice(),
                                    role : 'partner',
                                    email : self.partnerEmail(),
                                    password : self.password(),
                                    partnerId:self.partnerId(),
                                    franchiseId:0
                                }),
                                dataType: 'json',
                                timeout: sessionStorage.getItem("timeInetrval"),
                                context: self,
                                error: function (xhr, textStatus, errorThrown) {
                                    console.log(textStatus);
                                },
                                success: function (data) {
                                    console.log(data)
                                    let popup = document.getElementById("progress");
                                    popup.close();
                                    self.getPartnerPassword();
                                }
                            })
                        }
                    }
                }

                self.updatePartnerCredential = ()=>{
                    if(self.partnerId()==undefined){
                        document.getElementById("partnerCredentialMessage").style.display = "block";
                        setTimeout(()=>{
                            document.getElementById("partnerCredentialMessage").style.display = "none";
                        }, 5000);
                    }else{
                        const credentialFormValid = self._checkValidationGroup("credentialValidation"); 
                        if(credentialFormValid && self.partnerEmail() != ''){
                                let popup = document.getElementById("progress");
                                popup.open();
                                    $.ajax({
                                        url: BaseURL+"/updatePartnerCredential",
                                        type: 'POST',
                                        data: JSON.stringify({
                                            password : self.password(),
                                            partnerId:self.partnerId(),
                                        }),
                                        dataType: 'json',
                                        timeout: sessionStorage.getItem("timeInetrval"),
                                        context: self,
                                        error: function (xhr, textStatus, errorThrown) {
                                            console.log(textStatus);
                                        },
                                        success: function (data) {
                                           console.log(data)
                                           let popup = document.getElementById("progress");
                                           popup.close();
                                        }
                                    })
                                }
                            }
                }

                self.sendCredential = ()=>{
                    if(self.partnerId()==undefined){
                        document.getElementById("partnerCredentialMessage").style.display = "block";
                        setTimeout(()=>{
                            document.getElementById("partnerCredentialMessage").style.display = "none";
                        }, 5000);
                    }else{
                        const credentialFormValid = self._checkValidationGroup("credentialValidation"); 
                        if(credentialFormValid && self.partnerEmail() != ''){
                                let popup = document.getElementById("progress");
                                popup.open();
                                    $.ajax({
                                        url: BaseURL+"/sendPartnerCredential",
                                        type: 'POST',
                                        data: JSON.stringify({
                                            name : self.partnerName(),
                                            email : self.partnerEmail(),
                                            password : self.password(),
                                        }),
                                        dataType: 'json',
                                        timeout: sessionStorage.getItem("timeInetrval"),
                                        context: self,
                                        error: function (xhr, textStatus, errorThrown) {
                                            console.log(textStatus);
                                        },
                                        success: function (data) {
                                           console.log(data)
                                           let popup = document.getElementById("progress");
                                           popup.close();
                                        }
                                    })
                                }
                            }
                }

                self.getPartnerPassword = ()=>{
                    $.ajax({
                        url: BaseURL+"/getPartnerPassword",
                        type: 'POST',
                        data: JSON.stringify({
                            partnerId:self.partnerId(),
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                        if(data[0]!='No data found'){
                            data = JSON.parse(data);
                            console.log(data)
                            self.password(data[0][0])
                            self.btnAction('update');
                        }else{
                          self.generatePassword(8);
                          self.btnAction('save');
                        }
                        }
                    })
                }
            

            }
        }
        return  PartnerProfile;
    }
);