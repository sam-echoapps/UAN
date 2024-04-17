define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider",
    "ojs/ojlistdataproviderview","ojs/ojdataprovider", "ojs/ojkeyset",
    "ojs/ojinputtext", "ojs/ojformlayout", "ojs/ojvalidationgroup", "ojs/ojselectsingle", 
    "ojs/ojtable", "ojs/ojinputsearch", "ojs/ojdialog", "ojs/ojpopup", "ojs/ojprogress-circle", "ojs/ojmenu"], 
    function (oj,ko,$, app, ArrayDataProvider, ListDataProviderView, ojdataprovider_1, ojkeyset_1) {

        class Students {
            constructor(args) {
                var self = this;
                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL")
                
                self.officeId = ko.observable();
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));
                self.userId = ko.observable();
                self.office = ko.observable();
                
                if(self.userRole()=="admin" || self.userRole()=="director"){
                    self.officeId("All")
                    self.userId("All")
                }
                else if(self.userRole()=="manager"){
                    self.officeId(sessionStorage.getItem("userOfficeId"));
                    self.office(sessionStorage.getItem("userOfficeId"))
                    self.userId("All")
                }
                else{
                    self.officeId(sessionStorage.getItem("userOfficeId"));
                    self.office(sessionStorage.getItem("userOfficeId"))
                    self.userId(sessionStorage.getItem("userId"))
                }

                self.year = ko.observable(sessionStorage.getItem("selectYear"));
                
                self.studentsCnt = ko.observable();

                self.unAssignedData = ko.observableArray();

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
                                for(let i=0;i<len;i++){
                                    self.offices.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                            }
                        }
                    })
                }
                self.officesDP = new ArrayDataProvider(self.offices, {
                    keyAttributes: 'value'
                });
                self.getOffices()

                self.studentIds = ko.observableArray()

                self.getunassignedAllStudents = ()=>{
                    self.unAssignedData([]);
                    $.ajax({
                        url: BaseURL+"/getUnAssignedAllStudents",
                        type: 'GET',
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.studentIds([])
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.studentsCnt(len)
                                for(var i=0;i<len;i++){
                                    var date = data[i][5];
                                    date = new Date(date);
                                    var year = date.getFullYear();
                                    var month = ('0' + (date.getMonth() + 1)).slice(-2);
                                    var day = ('0' + date.getDate()).slice(-2);
                                    date =  `${day}-${month}-${year}`
                                    self.unAssignedData.push({
                                        id: data[i][0],
                                        firstName: data[i][3],
                                        lastName: data[i][4],
                                        office: data[i][2],
                                        destination: data[i][6],
                                        dateSubmitted: date
                                    })
                                }
                            }
                            else{
                                self.studentsCnt(0)
                                self.studentIds.push([])
                            }
                        }
                    })
                }

                self.getunassignedStudents = (officeId)=>{
                    self.unAssignedData([]);
                    $.ajax({
                        url: BaseURL+"/getUnassignedStudents",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: officeId
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.studentIds([])
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.studentsCnt(len)
                                for(var i=0;i<len;i++){
                                    var date = data[i][5];
                                    date = new Date(date);
                                    var year = date.getFullYear();
                                    var month = ('0' + (date.getMonth() + 1)).slice(-2);
                                    var day = ('0' + date.getDate()).slice(-2);
                                    date =  `${day}-${month}-${year}`
                                    self.unAssignedData.push({
                                        id: data[i][0],
                                        firstName: data[i][3],
                                        lastName: data[i][4],
                                        office: data[i][2],
                                        destination: data[i][6],
                                        dateSubmitted: date
                                    })
                                }
                            }
                            else{
                                self.studentsCnt(0)
                                self.studentIds.push([])
                            }
                        }
                    })
                }

    
                
                self.viewProfile = (e)=>{
                    // window.location.href = `/?ojr=studentProfile&id=${e.currentTarget.id}`;
                    window.open(`/?ojr=studentProfile&id=${e.currentTarget.id}`, "_blank");
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

                self.unAssignedDataprovider = ko.computed(function () {
                    let filterCriterion = null;
                    if (self.filter() && this.filter() != '') {
                        filterCriterion = ojdataprovider_1.FilterFactory.getFilter({
                            filterDef: { text: self.filter() }
                        });
                    }
                    const arrayDataProvider = new ArrayDataProvider(self.unAssignedData, { 
                        keyAttributes: 'id',
                        sortComparators: {
                            comparators: new Map().set("dob", this.comparator),
                        },
                    });
                    
                    return new ListDataProviderView(arrayDataProvider, { filterCriterion: filterCriterion });
                }, self);

                self.handleValueChanged = () => {
                    self.filter(document.getElementById('filter').rawValue);
                };

                self.counsilors = ko.observableArray()
                self.getCounsilors = (officeId)=>{
                    self.counsilors([]);
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
                                for(var i=0;i<len;i++){
                                    self.counsilors.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                            }
                        }
                    })
                }

                if(self.userRole()=="manager"){
                    self.getCounsilors(self.office());
                }

                self.officeSelectedData = (e)=>{
                    self.getCounsilors(e.target.value);
                    self.getunassignedStudents(e.target.value);
                }
                self.counsilorsDp = new ArrayDataProvider(self.counsilors, {
                    keyAttributes: 'value'
                });
                self.counsilor = ko.observable();
                
                self.selectedIds = ko.observableArray();

                self.selectedChangedListener = (event) => {
                    let selectionText = '';
                    self.selectedIds([])
                    if (event.detail.value.row.isAddAll()) {
                        const iterator = event.detail.value.row.deletedValues();
                        let removeArray = []
                        iterator.forEach(function (key) {
                            removeArray.push(key)
                        });
                        if (iterator.size > 0) {
                            self.selectedIds(self.studentIds().filter(value => !removeArray.includes(value)))
                        }
                        else{
                            self.selectedIds(self.studentIds())
                        }
                    }
                    else {
                        const row = event.detail.value.row;
                        let addArray = []
                        if (row.values().size > 0) {
                            row.values().forEach(function (key) {
                                addArray.push(key)
                            });
                            self.selectedIds(addArray)
                        }
                    }
                };

                self.message = ko.observable();
                self.warnMsg = ko.observable();

                self.assignData = ()=>{
                    let len = self.selectedIds().length;
                    let popUp = document.getElementById("msgBox")
                    if(self.office()== undefined || self.office()== ""){
                        self.message("Please select a office");
                        popUp.open();
                    }
                    else if(self.counsilor()==undefined){
                        self.message("Please select a counsilor");
                        popUp.open();
                    }
                    else if(len==0){
                        self.message("Please select students");
                        popUp.open();
                    }
                    else{
                        if(self.userRole()=="manager"){
                            self.warnMsg("Are you sure you want to assign counselor for the selected students?");
                        }
                        else{
                            self.warnMsg("Are you sure you want to assign counselor for the selected students?");
                        }
                        
                        let warnMsg = document.getElementById("warnMsg")
                        warnMsg.open()
                    }
                }

                self.resultMsg = ko.observable();
                
                self.warnMsgPopupCloseButton = ()=>{
                    let popUp = document.getElementById("warnMsg")
                    popUp.close();
                }

                self.confirmBulkAssign = ()=>{
                    let progress = document.getElementById("popup1")
                    progress.open()
                    let studentIds = self.selectedIds();
                    studentIds = studentIds.join(",");
                    $.ajax({
                        url: BaseURL+"/bulkAssignStudents",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: self.office(),
                            counsilorId: self.counsilor(),
                            studentId: studentIds,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {  
                            self.warnMsgPopupCloseButton()                          
                            let progress = document.getElementById("popup1")
                            progress.close()
                            self.resultMsg(data[0])
                            let resultPopup = document.getElementById("resultMsg")
                            resultPopup.open()
                        }
                    })
                }

                self.closeButton = ()=>{
                    let popUp = document.getElementById("msgBox")
                    popUp.close();
                }

                self.resultPopupCloseButton = ()=>{
                    self.getunassignedAllStudents()
                    let popUp = document.getElementById("resultMsg")
                    popUp.close();
                    self.office('');
                    self.counsilor('');
                    location.reload();
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
                
                self.getunassignedAllStudents()
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
        return  Students;
    }
);