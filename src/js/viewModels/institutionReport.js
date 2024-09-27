define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojlistdataproviderview","ojs/ojdataprovider", 
    "ojs/ojconverterutils-i18n",
    "ojs/ojbutton", "ojs/ojtable", "ojs/ojinputtext", "ojs/ojselectsingle", "ojs/ojdialog", "ojs/ojvalidationgroup", "ojs/ojformlayout", 
    "ojs/ojinputtext", "ojs/ojprogress-circle", "ojs/ojselectcombobox", "ojs/ojdatetimepicker", "ojs/ojinputnumber"], 
    function (oj,ko,$, app, ArrayDataProvider, ListDataProviderView, ojdataprovider_1, ojconverterutils_i18n_1) {

        class InstitutionReport {
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
                self.institutionNameList = ko.observableArray([]);
                self.blob = ko.observable();
                self.fileName = ko.observable();

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
                                var csvContent = '';
                                var headers = ['Institution Name', 'Institution Type', 'Terittory', 'Commission Rate New', 'Bonus/Special Offer', 'Application Method', 'Agent Port Details', 'Notes'];
                                csvContent += headers.join(',') + '\n';
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
                                    var rowData = [data[i][1], data[i][2], data[i][6],data[i][7], data[i][8], data[i][9], data[i][10], data[i][12]]; 
                                    csvContent += rowData.join(',') + '\n';
                                }
                                self.institutionNameList.push({value: `All`, label: `All`})
                                for(let j=0;j<len;j++){
                                    self.institutionNameList.push({value: `${data[j][0]}`, label: `${data[j][1]}`})
                                }
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Institution_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.blob(blob);
                                self.fileName(fileName);
                            }
                            else{
                                self.institutionCount(0)
                                var csvContent = '';
                                var headers = ['Institution Name', 'Institution Type', 'Terittory', 'Commission Rate New', 'Bonus/Special Offer', 'Application Method', 'Agent Port Details', 'Notes'];
                                csvContent += headers.join(',') + '\n';
                                var rowData = []; 
                                csvContent += rowData.join(',') + '\n';
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Institution_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.blob(blob);
                                self.fileName(fileName);
                            }
                        }
                    })
                }
                self.getInstitution();

                self.institutionNameListDP = new ArrayDataProvider(self.institutionNameList, {
                    keyAttributes: 'value'
                });

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
               
              
                self.institutionTypes = [
                    { value: 'All', label: 'All' },
                    { value: 'College', label: 'College' },
                    { value: 'University', label: 'Universities' },
                    { value: 'Pathways', label: 'Pathways'}
                ];
                self.institutionTypeSet = new ArrayDataProvider(self.institutionTypes, {
                    keyAttributes: 'value'
                });

                self.territories = [
                    { value: 'All', label: 'All' },
                    { value: 'Nepal', label: 'Nepal' },
                    { value: 'India', label: 'India' },
                    { value: 'UAE', label: 'UAE' },
                    { value: 'Global', label: 'Global' },
                ];
                self.territorySet = new ArrayDataProvider(self.territories, {
                    keyAttributes: 'value'
                });


                self.institutionName = ko.observable(['All']);
                self.institutionType = ko.observable(['All']);                
                self.territory = ko.observable(['All']);
       
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

                self.showData = ()=>{
                    let institutionType = self.institutionType();
                    institutionType = institutionType.join(",");
                    let institutionName = self.institutionName();
                    institutionName = institutionName.join(",");
                    let territory = self.territory();
                    territory = territory.join(",");
                    let popup = document.getElementById("progress");
                    popup.open();
                    self.institutionData([])
                    $.ajax({
                        url: BaseURL+"/getInstitutionReport",
                        type: 'POST',
                        data: JSON.stringify({
                            institutionType: institutionType,
                            institutionName: institutionName,
                            territory: territory
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.institutionCount(len);
                                var csvContent = '';
                                var headers = ['Institution Name', 'Institution Type', 'Terittory', 'Commission Rate New', 'Bonus/Special Offer', 'Application Method', 'Agent Port Details', 'Notes'];
                                csvContent += headers.join(',') + '\n';
                                for(var i=0;i<len;i++){
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

                                    var rowData = [data[i][1], data[i][2], data[i][6],data[i][7], data[i][8], data[i][9], data[i][10], data[i][12]]; 
                                    csvContent += rowData.join(',') + '\n';
                                }
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Institution_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.blob(blob);
                                self.fileName(fileName);
                            }
                            else{
                                self.institutionCount(0)
                                var csvContent = '';
                                var headers = ['Institution Name', 'Institution Type', 'Terittory', 'Commission Rate New', 'Bonus/Special Offer', 'Application Method', 'Agent Port Details', 'Notes'];
                                csvContent += headers.join(',') + '\n';
                                var rowData = []; 
                                csvContent += rowData.join(',') + '\n';
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Institution_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.blob(blob);
                                self.fileName(fileName);
                            }
                            let popup = document.getElementById("progress");
                            popup.close();
                        }
                    })
                }

                self.downloadData = ()=>{
                    if(self.blob() != undefined && self.fileName() != undefined){
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
                }
            }
        }
        return  InstitutionReport;
    }
);