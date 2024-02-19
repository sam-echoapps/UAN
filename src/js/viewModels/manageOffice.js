define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", 
    "ojs/ojlistdataproviderview","ojs/ojdataprovider",    
    "ojs/ojinputsearch", "ojs/ojvalidationgroup", "ojs/ojtable", "ojs/ojpopup", "ojs/ojformlayout", 
    "ojs/ojinputtext", "ojs/ojselectsingle", "ojs/ojdialog", "ojs/ojprogress-circle"], 
    function (oj,ko,$, app, ArrayDataProvider, ListDataProviderView, ojdataprovider_1) {

        class ManageOffice {
            constructor(args) {
                var self = this;
                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL")
                
                self.comparator = (a, b) => {
                    if (a === b) {
                        return 0;
                    }
                    const dateA = new Date(a).getTime();
                    const dateB = new Date(b).getTime();
                    return dateA < dateB ? -1 : 1;
                };

                self.filter = ko.observable('')

                self.handleValueChanged = ()=>{
                    self.filter(document.getElementById('filter').rawValue);
                }

                self.officeData = ko.observableArray([]);

                self.officesDataProvider = ko.computed(function () {
                    let filterCriterion = null;
                    if (self.filter() && this.filter() != '') {
                        filterCriterion = ojdataprovider_1.FilterFactory.getFilter({
                            filterDef: { text: self.filter() }
                        });
                    }
                    const arrayDataProvider = new ArrayDataProvider(self.officeData, { 
                        keyAttributes: 'studentId',
                        sortComparators: {
                            comparators: new Map().set("dateAdded", self.comparator),
                        },
                    });
                    
                    return new ListDataProviderView(arrayDataProvider, { filterCriterion: filterCriterion });
                }, self);

                self.searchOffice = ko.observable();
                self.officeSuggestions = ko.observable([]);;

                self.getOfficesWithManager = (status)=>{
                    let popup = document.getElementById("progressBar");
                    if(popup!=null){
                        popup.open();   
                    }
                    self.officeData([])
                    $.ajax({
                        url: BaseURL+"/getOfficeWithManager",
                        type: 'GET',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.officeData([])
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                if(status=="activeOffice"){
                                    data = data.filter(innerArray => innerArray.deactivate == 0);
                                }
                                else{
                                    data = data.filter(innerArray => innerArray.deactivate == 1);
                                }
                                let len = data.length;
                                for(var i=0;i<len;i++){
                                    self.officeSuggestions().push({value: `${data[i].officeId}`, label: `${data[i].officeId}. ${data[i].officeName}`})

                                    var date = data[i].createdDate;
                                    date = new Date(date);
                                    var year = date.getFullYear();
                                    var month = ('0' + (date.getMonth() + 1)).slice(-2);
                                    var day = ('0' + date.getDate()).slice(-2);
                                    date =  `${day}-${month}-${year}`
                                    self.officeData.push({
                                        id: data[i].officeId,
                                        office: data[i].officeName,
                                        manager: data[i].managers,
                                        dateAdded: date,
                                        studentCount: data[i].studentCount,
                                        userCount: data[i].userCount,
                                        status: data[i].deactivate
                                    });
                                }                                    
                            }
                            let popup = document.getElementById("progressBar");
                            if(popup){
                                popup.close();
                            }
                        }
                    })
                }
                self.getOfficesWithManager("activeOffice");

                self.officesSuggestionsDP = new ArrayDataProvider(self.officeSuggestions(), {
                    keyAttributes: "value",
                });


                self.addOffice = ()=>{
                    let popup = document.getElementById("addOffice");
                    popup.open();
                }

                self.officeError = ko.observable();
                self.officeValidator = (office)=>{
                    return new Promise(function(resolve, reject) {
                        var pattern = /^[0-9a-zA-Z\s]+$/;
                        if(pattern.test(office)){
                            self.officeError('')
                            resolve("")
                        }
                        else{
                            resolve("Office names must not include special characters. ");
                        }   
                    })
                }
                
                self.office = ko.observable();
                self.submitOffice = ()=>{
                    const formValid = self._checkValidationGroup("formValidation"); 
                    if (formValid) {
                        self.officeValidator(self.office()).then(function(result1){
                            self.officeError(result1);
                            if(self.officeError()==""){
                                let popup = document.getElementById("progressBar");
                                popup.open();
                                $.ajax({
                                    url: BaseURL+"/addOffice",
                                    type: 'POST',
                                    data: JSON.stringify({
                                        office: self.office(),
                                        manager: ""
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
                        })
                    }
                }

                self.cancelListener = ()=>{
                    let popup = document.getElementById("addOffice");
                    popup.close();
                }      
                
                self.editOfficeName = ko.observable();
                self.editManager = ko.observable();
                self.editOfficeId = ko.observable();
                
                self.editOffice = (event)=>{
                    let officeId = event.currentTarget.id
                    $.ajax({
                        url: BaseURL+"/searchOffice",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: officeId
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                self.editOfficeId(officeId)
                                self.editOfficeName(data[0][1]);
                                self.editManager(data[0][2]);
                                let popup = document.getElementById("editOffice");
                                popup.open();
                            }
                        }
                    })
                }

                self.editCancel = ()=>{
                    let popup = document.getElementById("editOffice");
                    popup.close();
                }
                
                self.editOfficeError = ko.observable();

                self.updateOffice = ()=>{
                    self.officeValidator(self.editOfficeName()).then(function(result1){
                        self.editOfficeError(result1);
                        if(self.editOfficeError()==""){
                            let popup = document.getElementById("progressBar");
                            popup.open();
                            $.ajax({
                                url: BaseURL+"/updateOffice",
                                type: 'POST',
                                data: JSON.stringify({
                                    officeId: self.editOfficeId(),
                                    office: self.editOfficeName(),
                                    manager: self.editManager()
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
                    })
                }

                self.usersData = ko.observableArray();

                self.clickedOfficeId = ko.observable();

                self.counsilorIds = ko.observableArray();

                self.viewCounsilors = (e)=>{
                    let officeId = ""
                    if(e.currentTarget){
                        officeId = e.currentTarget.id;
                    }
                    else{
                        officeId = e;
                    }
                    self.clickedOfficeId(officeId)
                    self.usersData([])
                    self.counsilorIds([])
                    $.ajax({
                        url: BaseURL+"/getOfficeAllCounsilors",
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
                                let len = data.length;
                                for(var i=0;i<len;i++){
                                    let status = data[i][6]
                                    if(status==0){
                                        status = "Active"
                                    }
                                    else{
                                        status = "Deactive"
                                    }
                                    self.usersData.push({
                                        id: data[i][0],
                                        name: data[i][3],
                                        username: data[i][2],
                                        role: data[i][4],
                                        studentCount: data[i][5],
                                        status: status
                                    });
                                    self.counsilorIds.push(data[i][0])
                                }
                                let counsilorList = document.getElementById("counsilorList");
                                counsilorList.open();
                            }
                        }
                    })
                }

                self.usersDataProvider = new ArrayDataProvider(self.usersData, { 
                    keyAttributes: 'id',
                });

                self.closeCounsilorList = ()=>{
                    let counsilorList = document.getElementById("counsilorList");
                    counsilorList.close();
                }

                self.studentData = ko.observableArray()

                self.viewStudents = (e)=>{
                    let officeId = e.currentTarget.id;
                    self.studentData([])
                    $.ajax({
                        url: BaseURL+"/getOfficeStudents",
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
                                let len = data.length;
                                for(var i=0;i<len;i++){
                                    self.studentData.push({
                                        id: data[i][0],
                                        firstName: data[i][1],
                                        lastName: data[i][2],
                                        email: data[i][3],
                                        phone: data[i][4],
                                        dob: data[i][5],
                                        counselor: data[i][6],
                                        office: data[i][7]
                                    });
                                }
                                let studentsList = document.getElementById("studentsList");
                                studentsList.open();
                            }
                        }
                    })
                }

                self.studentDataProvider = new ArrayDataProvider(self.studentData, { 
                    keyAttributes: 'id',
                });

                self.viewProfile = (e)=>{
                    // window.location.href = `/?ojr=studentProfile&id=${e.currentTarget.id}`;
                    window.open(`/?ojr=studentProfile&id=${e.currentTarget.id}`, "_blank");
                }

                self.closeStudentList = ()=>{
                    let studentsList = document.getElementById("studentsList");
                    studentsList.close();
                }

                self.officeId = ko.observable();
                self.offices = [];
                self.officeId = ko.observable()
                self.getOffices = ()=>{
                    $.ajax({
                        url: BaseURL+"/getOffices",
                        type: 'GET',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!='No data found'){
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

                self.officeSelectedData = (e)=>{
                    self.getCounsilors(e.target.value);
                }
                self.counsilorsDp = new ArrayDataProvider(self.counsilors, {
                    keyAttributes: 'value'
                });
                self.counsilor = ko.observable();

                self.reAssignStudentData = ko.observableArray();
                self.studentIds = ko.observableArray();

                self.viewReassignStudents = (e)=>{
                    self.officeId("");
                    let userId = e.currentTarget.id
                    self.reAssignStudentData([]);
                    $.ajax({
                        url: BaseURL+"/getCounsilorAllStudents",
                        type: 'POST',
                        data: JSON.stringify({
                            counsilorId: userId,
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
                                    self.reAssignStudentData.push({
                                        id: data[i][0],
                                        firstName: data[i][1],
                                        lastName: data[i][2],
                                        email: data[i][3],
                                        phone: data[i][4],
                                        dob: data[i][5],
                                        counselor: data[i][6],
                                        office: data[i][7]
                                    });
                                    self.studentIds.push(data[i][0])
                                }
                                let counsilorList = document.getElementById("counsilorList");
                                counsilorList.close();
                                let popup = document.getElementById("studentReassignList");
                                popup.open();
                            }
                        }
                    })
                }

                self.reAssignStudentDataProvider = new ArrayDataProvider(self.reAssignStudentData, { 
                    keyAttributes: 'id',
                });

                self.selectedIds = ko.observableArray();

                self.selectedChangedListener = (e)=>{
                    let selectionText = '';
                    self.selectedIds([])
                    if (e.detail.value.row.isAddAll()) {
                        const iterator = e.detail.value.row.deletedValues();
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
                        const row = e.detail.value.row;
                        let addArray = []
                        if (row.values().size > 0) {
                            row.values().forEach(function (key) {
                                addArray.push(key)
                            });
                            self.selectedIds(addArray)
                        }
                    }
                }

                self.message = ko.observable();
                self.warnMsg = ko.observable();
                self.resultMsg = ko.observable();

                self.reassignData = ()=>{
                    let len = self.selectedIds().length;
                    let msgBox = document.getElementById("msgBox")
                    if(self.officeId()== undefined || self.officeId()== ""){
                        self.message("Please select a office");
                        msgBox.open();
                    }
                    else if(self.counsilor()==undefined){
                        self.message("Please select a counsilor");
                        msgBox.open();
                    }
                    else if(len==0){
                        self.message("Please select students");
                        msgBox.open();
                    }
                    else{
                        self.warnMsg("Are you sure you want to change office and counselor of the selected students?");                        
                        let warnMsg = document.getElementById("warnMsg")
                        warnMsg.open()
                    }
                }

                self.closeButton = ()=>{
                    let msgBox = document.getElementById("msgBox")
                    msgBox.close()
                }

                self.confirmReassign = ()=>{
                    let progress = document.getElementById("progressBar")
                    progress.open()
                    let studentIds = self.selectedIds();
                    studentIds = studentIds.join(",");
                    $.ajax({
                        url: BaseURL+"/reAssignStudents",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: self.officeId(),
                            counsilorId: self.counsilor(),
                            studentId: studentIds,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {  
                            self.warnMsgPopupCloseButton()                          
                            let progress = document.getElementById("progressBar")
                            progress.close()
                            self.resultMsg(data[0])
                            let popup = document.getElementById("studentReassignList");
                            popup.close();
                            let resultPopup = document.getElementById("resultMsg")
                            resultPopup.open()
                        }
                    })
                }

                self.warnMsgPopupCloseButton = ()=>{
                    let warnMsg = document.getElementById("warnMsg")
                    warnMsg.close()
                }

                self.resultPopupCloseButton = ()=>{
                    self.viewCounsilors(self.clickedOfficeId())
                    let resultMsg = document.getElementById("resultMsg")
                    resultMsg.close()
                }

                self.closeStudentReassignList = ()=>{
                    let studentsList = document.getElementById("studentReassignList");
                    studentsList.close();
                }

                self.selectedCounsilors = ko.observableArray();

                self.selectedCounsilorChangedListener = (e)=>{
                    let selectionText = '';
                    self.selectedCounsilors([])
                    if (e.detail.value.row.isAddAll()) {
                        const iterator = e.detail.value.row.deletedValues();
                        let removeArray = []
                        iterator.forEach(function (key) {
                            removeArray.push(key)
                        });
                        if (iterator.size > 0) {
                            self.selectedCounsilors(self.counsilorIds().filter(value => !removeArray.includes(value)))
                        }
                        else{
                            self.selectedCounsilors(self.counsilorIds())
                        }
                    }
                    else {
                        const row = e.detail.value.row;
                        let addArray = []
                        if (row.values().size > 0) {
                            row.values().forEach(function (key) {
                                addArray.push(key)
                            });
                            self.selectedCounsilors(addArray)
                        }
                    }
                }

                self.counselorWarnMsg = ko.observable();

                self.reassignCounselor = ()=>{
                    let len = self.selectedCounsilors().length;
                    let msgBox = document.getElementById("msgBox")
                    if(self.officeId()== undefined || self.officeId()== ""){
                        self.message("Please select a office");
                        msgBox.open();
                    }
                    else if(len==0){
                        self.message("Please select counselors");
                        msgBox.open();
                    }
                    else{
                        let counsilorIds = self.selectedCounsilors();
                        counsilorIds = counsilorIds.join(",");
                        $.ajax({
                            url: BaseURL+"/getCounsilorCount",
                            type: 'POST',
                            data: JSON.stringify({
                                counsilorId: counsilorIds,
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {  
                                if(data[0]=="No data found"){
                                    self.counselorWarnMsg("Are you sure you want to change office of the selected counselors?");                        
                                    let warnMsg = document.getElementById("counselorWarnMsg")
                                    warnMsg.open()
                                }
                                else{
                                    self.message("Please reassign students of the selected counselors");
                                    msgBox.open();
                                }
                            }
                        })
                    }
                }
                
                self.counselorWarnMsgPopupCloseButton = ()=>{
                    let warnMsg = document.getElementById("counselorWarnMsg")
                    warnMsg.close()
                }

                self.counselorResultMsg = ko.observable();

                self.confirmCounselorReassign = ()=>{
                    self.counselorWarnMsgPopupCloseButton();
                    let progress = document.getElementById("progressBar")
                    progress.open()
                    let counselorIds = self.selectedCounsilors();
                    counselorIds = counselorIds.join(",");
                    $.ajax({
                        url: BaseURL+"/reAssignCounselors",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: self.officeId(),
                            counsilorId: counselorIds,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {                         
                            let progress = document.getElementById("progressBar")
                            progress.close()
                            self.counselorResultMsg(data[0])
                            let popup = document.getElementById("counsilorList");
                            popup.close();
                            let resultPopup = document.getElementById("counselorResultMsg")
                            resultPopup.open()
                        }
                    })
                }

                self.counselorResultPopupCloseButton = ()=>{
                    let resultPopup = document.getElementById("counselorResultMsg")
                    resultPopup.close()
                    self.getOfficesWithManager("activeOffice")
                    self.selectedTab("activeOffice")
                }

                self.deleteName = ko.observable();
                self.deleteId = ko.observable();
                self.deleteOffice = (event)=>{
                    let officeId = event.currentTarget.id
                    $.ajax({
                        url: BaseURL+"/searchOffice",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: officeId
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            data = JSON.parse(data);
                            self.deleteId(officeId)
                            self.deleteName(data[0][1]);
                            if(data[1][0][0]==0){
                                let popup = document.getElementById("deleteMsg");
                                popup.open();
                            }
                            else{
                                self.message("Counselors found in this office please reassign these counselors then try to deactivate");
                                let msgBox = document.getElementById("msgBox");
                                msgBox.open();
                            }  
                        }
                    })
                }

                self.deleteConfirm = ()=>{
                    let popup = document.getElementById("progressBar");
                    popup.open();
                    let deleteMsg = document.getElementById("deleteMsg");
                    deleteMsg.close();
                    $.ajax({
                        url: BaseURL+"/deleteOffice",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: self.deleteId()
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            let popup = document.getElementById("progressBar");
                            popup.close();
                            self.getOfficesWithManager("activeOffice")
                            self.selectedTab("activeOffice")
                            self.message(data[0]);
                            let msgBox = document.getElementById("msgBox");
                            msgBox.open();
                        }
                    })
                }

                self.cancelDelete = ()=>{
                    let popup = document.getElementById("deleteMsg");
                    popup.close();
                }

                self.activateOffice = (e)=>{
                    let officeId = e.currentTarget.id
                    $.ajax({
                        url: BaseURL+"/activateOffice",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: officeId
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.getOfficesWithManager("activeOffice")
                            self.selectedTab("activeOffice")
                            self.message(data[0]);
                            let msgBox = document.getElementById("msgBox");
                            msgBox.open();
                        }
                    })
                }

                self.tabData = [
                    { id: "activeOffice", label: "Active Offices" },
                    { id: "deactiveOffice", label: "Deactived Offices" },
                ];

                self.selectedTab = ko.observable("activeOffice");
                self.selectedTabAction = ko.computed(() => { 
                    let addButton = document.getElementById("addButton");  
                    if(self.selectedTab()=="deactiveOffice"){
                        addButton.style.display = "none";
                    }
                    else{
                        if(addButton!=null){
                            addButton.style.display = "block";
                        }
                    }
                    self.getOfficesWithManager(self.selectedTab())
                });

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
                    }
                }

                
            }
        }
        return  ManageOffice;
    }
);