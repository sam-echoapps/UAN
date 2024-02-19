define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojfilepickerutils",
    "ojs/ojinputtext", "ojs/ojformlayout", "ojs/ojvalidationgroup", "ojs/ojselectsingle","ojs/ojdatetimepicker",
     "ojs/ojfilepicker", "ojs/ojpopup", "ojs/ojprogress-circle", "ojs/ojdialog"], 
    function (oj,ko,$, app, ArrayDataProvider, FilePickerUtils) {

        class AddStudent {
            constructor(args) {
                var self = this;

                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL")
                
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));

                self.firstName = ko.observable();
                self.lastName = ko.observable();
                self.phone = ko.observable();
                self.email = ko.observable();
                self.office = ko.observable();
                self.nationality = ko.observable();
                self.dob = ko.observable();
                self.marketingSource = ko.observable();
                self.fileName = ko.observableArray();
                self.phoneError = ko.observable('');
                self.emailError = ko.observable('');
                self.course = ko.observable('');

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

                self.partner = ko.observable();


                self.offices = ko.observableArray([]);
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
                                self.offices([])
                                let len = data.length;
                                for(let i=0;i<len;i++){
                                    self.offices.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                            }
                        }
                    })
                }
                self.officesList = new ArrayDataProvider(self.offices, {
                    keyAttributes: 'value'
                });

                self.officeChangeHandler = ()=>{
                    self.getCounselors(self.office())
                }

                self.counsilor = ko.observable();
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

                if(self.userRole()=="manager"){
                    self.office(sessionStorage.getItem("userOfficeId"));
                    self.getCounselors(self.office());
                }
                
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
                            
                            if(self.userRole()=="counselor"){
                                self.office(sessionStorage.getItem("userOfficeId"));
                                self.counsilor(sessionStorage.getItem("userId"));
                            }
                            $.ajax({
                                url: BaseURL+"/addStudent",
                                type: 'POST',
                                data: JSON.stringify({
                                    firstName : self.firstName(),
                                    lastName : self.lastName(),
                                    countryCode : self.countryCode(),
                                    phone : self.phone(),
                                    email : self.email(),
                                    office : self.office(),
                                    counselor : self.counsilor(),
                                    course : self.course(),
                                    nationality : self.nationality(),
                                    dob : self.dob(),
                                    leadSource : self.marketingSource(),
                                    addUserId : sessionStorage.getItem("userId"),
                                    studyAbroadDestination: self.studyAbroadDestination()
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
                    }
                }

                self.messageClose = ()=>{
                    location.reload();
                }

                self.openSuccess = ()=>{
                    let popup1 = document.getElementById("popup2");
                    popup1.open();
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
                    location.reload()
                }

                self.partnerFormSubmit = ()=>{
                    const formValid = self._checkValidationGroup("formValidation"); 
                    if (formValid) {
                        if(self.emailError()=='' && self.phoneError()==''){
                            let popup = document.getElementById("popup1");
                            popup.open();
                            
                            if(self.userRole()=="partner"){
                                self.office(sessionStorage.getItem("userOfficeId"));
                                self.partner(sessionStorage.getItem("userPartnerId"));
                            }
                            $.ajax({
                                url: BaseURL+"/addPartnerStudent",
                                type: 'POST',
                                data: JSON.stringify({
                                    firstName : self.firstName(),
                                    lastName : self.lastName(),
                                    countryCode : self.countryCode(),
                                    phone : self.phone(),
                                    email : self.email(),
                                    office : self.office(),
                                    partner : self.partner(),
                                    nationality : self.nationality(),
                                    dob : self.dob(),
                                    leadSource : self.marketingSource(),
                                    studyAbroadDestination: self.studyAbroadDestination()
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
                    }
                }


                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        app.onAppSuccess();
                        self.getOffices();
                    }
                }

            }
        }
        return  AddStudent;
    }
);