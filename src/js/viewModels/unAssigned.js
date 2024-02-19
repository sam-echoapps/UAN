define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider",
    "ojs/ojlistdataproviderview","ojs/ojdataprovider",
    "ojs/ojinputtext", "ojs/ojformlayout", "ojs/ojvalidationgroup", "ojs/ojselectsingle", 
    "ojs/ojtable", "ojs/ojinputsearch", "ojs/ojmenu"], 
    function (oj,ko,$, app, ArrayDataProvider, ListDataProviderView, ojdataprovider_1) {

        class UnAssigned {
            constructor(args) {
                var self = this;
                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL")
                
                self.userOfficeId = ko.observable();
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));
                self.userId = ko.observable();
                if(self.userRole()=="admin" || self.userRole()=="director"){
                    self.userOfficeId("All")
                    self.userId("All")
                }
                else{
                    self.userOfficeId(sessionStorage.getItem("userOfficeId"));
                    self.userId("All")
                }
                
                self.unAsignedStudentCnt = ko.observable();

                self.offices = ko.observableArray();
                self.getOffices = ()=>{
                    $.ajax({
                        url: BaseURL+"/getOffices",
                        type: 'GET',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.offices([])
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.offices.push({value: `All`, label: `All`})
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

                self.officeChangeHandler = (e)=>{
                    let selectOffice = e.detail.value;
                    self.getUnAssignedStudents()
                }

                self.studentData = ko.observableArray([]);

                self.year = ko.observable(sessionStorage.getItem("selectYear"));

                self.getUnAssignedStudents = ()=>{
                    self.studentData([]);
                    $.ajax({
                        url: BaseURL+"/getUnassignedStudentsYear",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: self.userOfficeId(),
                            year: self.year()
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.unAsignedStudentCnt(len)
                                for(var i=0;i<len;i++){
                                    var date = data[i][5];
                                    date = new Date(date);
                                    var year = date.getFullYear();
                                    var month = ('0' + (date.getMonth() + 1)).slice(-2);
                                    var day = ('0' + date.getDate()).slice(-2);
                                    date =  `${day}-${month}-${year}`
                                    self.studentData.push({
                                        id: data[i][0],
                                        firstName: data[i][3],
                                        lastName: data[i][4],
                                        office: data[i][2],
                                        date: date
                                    });
                                }
                            }
                            else{
                                self.unAsignedStudentCnt(0)
                            }
                        }
                    })
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

                self.studentDataProvider = ko.computed(function () {
                    let filterCriterion = null;
                    if (self.filter() && this.filter() != '') {
                        filterCriterion = ojdataprovider_1.FilterFactory.getFilter({
                            filterDef: { text: self.filter() }
                        });
                    }
                    const arrayDataProvider = new ArrayDataProvider(self.studentData, { 
                        keyAttributes: 'id',
                        sortComparators: {
                            comparators: new Map().set("date", self.comparator),
                        },
                    });
                    
                    return new ListDataProviderView(arrayDataProvider, { filterCriterion: filterCriterion });
                }, self);

                self.handleValueChanged = () => {
                    self.filter(document.getElementById('filter').rawValue);
                };

                self.viewProfile = (e)=>{
                    // window.location.href = `/?ojr=studentProfile&id=${e.currentTarget.id}`;
                    window.open(`/?ojr=studentProfile&id=${e.currentTarget.id}`, "_blank");
                }

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
                    const context = document.getElementById("table").getContextByNode(target);
                    self.stIdRightClick(context.key);
                };

                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        app.onAppSuccess();
                        if (sessionStorage.getItem("userRole") === "admin" || sessionStorage.getItem("userRole") === "director") {
                            self.getOffices()
                        }
                        self.getUnAssignedStudents()
                    }
                }
            }
        }
        return  UnAssigned;
    }
);