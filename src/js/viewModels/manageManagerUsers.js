define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojpagingdataproviderview", "ojs/ojarraydataprovider", 
    "ojs/ojlistdataproviderview","ojs/ojdataprovider",    
    "ojs/ojinputsearch", "ojs/ojtable", "ojs/ojformlayout", "ojs/ojinputtext", "ojs/ojselectsingle", 
    "ojs/ojvalidationgroup", "ojs/ojprogress-circle", "ojs/ojpagingcontrol"], 
    function (oj,ko,$, app, PagingDataProviderView, ArrayDataProvider, ListDataProviderView, ojdataprovider_1) {

        class ManagerUsers {
            constructor(args) {
                var self = this;
                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL")
                
                self.user = ko.observable();
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));
                
                self.userOfficeId = ko.observable();
                self.userOfficeId(sessionStorage.getItem("userOfficeId"));

                self.suggestions = [];
                self.suggestionsDP = new ArrayDataProvider(self.suggestions, {
                    keyAttributes: "value",
                });

                self.comparator = (a, b) => {
                    if (a === b) {
                        return 0;
                    }
                    const dateA = new Date(a).getTime();
                    const dateB = new Date(b).getTime();
                    return dateA < dateB ? -1 : 1;
                };

                self.usersData = ko.observableArray([]);

                self.filter = ko.observable('')

                self.activeStaffCount = ko.observable('0');
                self.inactiveStaffCount = ko.observable('0');

                self.handleValueChanged = ()=>{
                    self.filter(document.getElementById('filter').rawValue);
                }

                self.usersDataProvider = ko.computed(function () {
                    let filterCriterion = null;
                    if (self.filter() && this.filter() != '') {
                        filterCriterion = ojdataprovider_1.FilterFactory.getFilter({
                            filterDef: { text: self.filter() }
                        });
                    }
                    const arrayDataProvider = new ArrayDataProvider(self.usersData, { 
                        keyAttributes: 'studentId',
                        sortComparators: {
                            comparators: new Map().set("date", self.comparator),
                        },
                    });
                    
                    return new ListDataProviderView(arrayDataProvider, { filterCriterion: filterCriterion });
                }, self);

                self.getUsers = (status)=>{
                    let popup = document.getElementById("progress");
                    if(popup){
                        popup.open();
                    }
                    self.usersData([])
                    $.ajax({
                        url: BaseURL+"/getManagerUsers",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: self.userOfficeId(),
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.usersData([])
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                if(self.userRole()=="manager"){
                                    data = data.filter(innerArray => innerArray[3] !== 'admin' && innerArray[3]!='director');
                                }
                                if(status=="activeStaff"){
                                    data = data.filter(innerArray => innerArray[8] == 0);
                                }
                                else{
                                    data = data.filter(innerArray => innerArray[8] == 1);
                                }
                                let len = data.length;
                                for(var i=0;i<len;i++){
                                    self.suggestions.push({value: `${data[i][0]}`, label: `${data[i][0]}. ${data[i][1]}`})
                                    var date = data[0][6];
                                    date = new Date(date);
                                    var year = date.getFullYear();
                                    var month = ('0' + (date.getMonth() + 1)).slice(-2);
                                    var day = ('0' + date.getDate()).slice(-2);
                                    date =  `${day}-${month}-${year}`
                                    var role = data[i][3].charAt(0).toUpperCase() + data[i][3].slice(1);
                                                
                                    self.usersData.push({
                                        slno: i+1,
                                        id: data[i][0],
                                        name: data[i][1],
                                        office: data[i][2],
                                        role: role,
                                        username: data[i][4],
                                        email: data[i][9],
                                        password: data[i][5],
                                        date: date,
                                        studentCount: data[i][7],
                                        status: data[i][8]
                                    });
                                }
                            }
                            let popup = document.getElementById("progress");
                            if(popup){
                                popup.close();
                            }
                        }
                    })
                }
                self.getUsers("activeStaff")
                

                self.office = ko.observableArray()
                self.getOfficess = (office)=>{
                    $.ajax({
                        url: BaseURL+"/getOffices",
                        type: 'GET',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.office([])
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                let len = data.length;
                                for(let i=0;i<len;i++){
                                    self.office.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                                if(self.userRole()=="manager"){
                                    self.selectOffice(sessionStorage.getItem("userOfficeId"));
                                    self.editOffice(sessionStorage.getItem("userOfficeId"));
                                    self.officeId(sessionStorage.getItem("userOfficeId"));
                                }
                            }
                        }
                    })
                }

                self.officeDp = new ArrayDataProvider(self.office, {
                    keyAttributes: 'value'
                }); 

                if(self.userRole()=="manager"){
                    self.role = [
                        {value: 'manager', label: 'Manager'},
                        {value: 'counselor', label: 'Counselor'},
                    ]
                }
                else{
                    self.role = [
                        {value: 'manager', label: 'Manager'},
                        {value: 'director', label: 'Director'},
                        {value: 'counselor', label: 'Counselor'},
                    ]
                }
                self.roleDp = new ArrayDataProvider(self.role, {
                    keyAttributes: 'value'
                }); 

                self.name = ko.observable();
                self.selectOffice = ko.observable();
                self.selectRole = ko.observable();
                self.email = ko.observable();
                self.emailError = ko.observable();
                self.password = ko.observable();

                self.generatePassword = (length) =>{
                    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]\;?><,./-=1234567890';
                    let password = '';
                    
                    for (let i = 0; i < length; i++) {
                      const randomIndex = Math.floor(Math.random() * charset.length);
                      password += charset[randomIndex];
                    }
                    
                    return password;
                }

                self.addUserPopUp = ()=>{
                    let popup = document.getElementById("addUser");
                    popup.open();
                    self.password(self.generatePassword(8))
                }

                self.roleError = ko.observable();

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

                self.emailCheck = (emailId)=>{
                    return new Promise(function(resolve, reject) {
                        $.ajax({
                            url: BaseURL+"/getStaffEmailCount",
                            type: 'POST',
                            data: JSON.stringify({
                                email : emailId,
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                if(data[0][0]!=0){
                                    resolve(1)
                                }
                                else{
                                    resolve(0)
                                }
                            }
                        })
                    })
                }

                self.addUser = ()=>{
                    const formValid = self._checkValidationGroup("usersApplication"); 
                    if(formValid){
                        self.emailCheck(self.email()).then(function(response){
                            if(response==1){
                                self.emailError("Email id already existed");
                            }
                            else{
                                if(self.emailError()==''){
                                    let popup = document.getElementById("progress");
                                    popup.open();
                                    $.ajax({
                                        url: BaseURL+"/addUser",
                                        type: 'POST',
                                        data: JSON.stringify({
                                            name : self.name(),
                                            office : self.selectOffice(),
                                            role : self.selectRole(),
                                            email : self.email(),
                                            password : self.password()
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
                        })
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

                self.cancelAddUserPopup = ()=>{
                    let popup = document.getElementById("addUser");
                    popup.close();
                }
                
                self.editName = ko.observable();
                self.editOffice = ko.observable();
                
                self.editRole = ko.observable();
                self.editEmail = ko.observable();
                self.edEmail = ko.observable();
                self.editPassword = ko.observable();
                self.editId = ko.observable();

                self.editUser = (event)=>{
                    let userId = event.currentTarget.id
                    $.ajax({
                        url: BaseURL+"/searchUser",
                        type: 'POST',
                        data: JSON.stringify({
                            userId: userId
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                self.editId(data[0][0])
                                self.editName(data[0][1])
                                self.editRole(data[0][3])
                                self.editEmail(data[0][7])
                                self.edEmail(data[0][7])
                                self.editPassword(data[0][5])
                                
                                let len = self.office().length;
                                for(var i=0;i<len;i++){
                                    if(self.office()[i].label==data[0][2]){
                                        self.editOffice(`${self.office()[i].value}`);
                                    }
                                }
                                self.roleError("")
                                self.emailError("")
                                let popup = document.getElementById("editUser");
                                popup.open();
                            }
                        }
                    })
                }

                self.updateStudent = ()=>{
                    const formValid = self._checkValidationGroup("userEdit"); 
                    if(formValid){
                        self.emailCheck(self.editEmail()).then(function(response){
                            if(response==1 && self.edEmail()!=self.editEmail()){
                                self.emailError("Email id already existed");
                            }
                            else{
                                if(self.emailError()==''){
                                    let popup = document.getElementById("progress");
                                    popup.open();
                                    $.ajax({
                                        url: BaseURL+"/updateUser",
                                        type: 'POST',
                                        data: JSON.stringify({
                                            userId: self.editId(),
                                            name : self.editName(),
                                            office : self.editOffice(),
                                            role : self.editRole(),
                                            email : self.editEmail(),
                                            password : self.editPassword()
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
                        })
                    }
                }

                self.cancelEditUserPopup = ()=>{
                    let popup = document.getElementById("editUser");
                    popup.close();
                }

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

                self.studentIds = ko.observableArray()
                self.studentData = ko.observableArray();

                self.blob = ko.observable();
                self.fileName = ko.observable();

                self.viewStudents = (e)=>{
                    let userId = e.currentTarget.id
                    self.studentData([]);
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
                                var csvContent = '';
                                var headers = ['Student Id', 'First name', 'Last Name', 'Email', 'Phone','DOB'];
                                csvContent += headers.join(',') + '\n';
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
                                    self.studentIds.push(data[i][0])
                                    var rowData = [data[i][0], data[i][1], data[i][2], data[i][3], data[i][4], data[i][5]]; 
                                    csvContent += rowData.join(',') + '\n';
                                }
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = data[0][6]+'_Students'+'.csv';
                                self.blob(blob);
                                self.fileName(fileName);
                                
                                if(self.userRole()=="manager"){
                                    self.getCounsilors(self.officeId());
                                }
                                let popup = document.getElementById("studentReassignList");
                                popup.open();
                            }
                        }
                    })
                }

                self.downloadData = ()=>{
                    if(self.blob() != undefined && self.fileName() != undefined){
                        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                            window.navigator.msSaveOrOpenBlob(self.blob(), self.fileName());
                        } else {
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

                
                // self.studentDataProvider = new ArrayDataProvider(self.studentData, { 
                //     keyAttributes: 'id',
                // });

                self.studentDataProvider = new PagingDataProviderView(new ArrayDataProvider(self.studentData, {
                    keyAttributes: "id" 
                }));


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
                
                self.viewProfile = (e)=>{
                    // window.location.href = `/?ojr=studentProfile&id=${e.currentTarget.id}`;
                    window.open(`/?ojr=studentProfile&id=${e.currentTarget.id}`, "_blank");
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
                        if(self.userRole()=="manager"){
                            self.warnMsg("Are you sure you want to change counselor of the selected students?");                        
                        }
                        else{
                            self.warnMsg("Are you sure you want to change office and counselor of the selected students?");                        
                        }
                        let warnMsg = document.getElementById("warnMsg")
                        warnMsg.open()
                    }
                }

                self.closeButton = ()=>{
                    let msgBox = document.getElementById("msgBox")
                    msgBox.close()
                    location.reload()
                }
                
                self.confirmReassign = ()=>{
                    let progress = document.getElementById("progress")
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
                            let progress = document.getElementById("progress")
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
                    self.getUsers("activeStaff")
                    let resultMsg = document.getElementById("resultMsg")
                    resultMsg.close()
                }

                self.closeStudents = ()=>{
                    let popup = document.getElementById("studentReassignList");
                    popup.close();
                }

                self.deleteName = ko.observable();

                self.deleteUser = (event)=>{
                    let userId = event.currentTarget.id
                    self.editId(userId)
                    $.ajax({
                        url: BaseURL+"/searchUser",
                        type: 'POST',
                        data: JSON.stringify({
                            userId: userId,
                        }),
                        dataType: 'json',
                        timeout: sessionStorage.getItem("timeInetrval"),
                        context: self,
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                self.deleteName(data[0][1])
                                if(data[1][0][0]==0){
                                    let popup = document.getElementById("deleteMsg");
                                    popup.open();
                                }
                                else{
                                    self.message("This staff has students assigned under them, please reassign the students to deactivate the staff.");
                                    let msgBox = document.getElementById("msgBox");
                                    msgBox.open();
                                }                            
                            }
                        }
                    })
                }

                self.deleteConfirm = ()=>{
                    $.ajax({
                        url: BaseURL+"/deleteUser",
                        type: 'POST',
                        data: JSON.stringify({
                            userId: self.editId(),
                        }),
                        dataType: 'json',
                        timeout: sessionStorage.getItem("timeInetrval"),
                        context: self,
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            let popup = document.getElementById("deleteMsg");
                            popup.close();
                            self.getUsers("activeStaff")
                            location.reload()
                        }
                    })
                }

                self.activateUser = (e)=>{
                    let userId = e.currentTarget.id
                    $.ajax({
                        url: BaseURL+"/activateUser",
                        type: 'POST',
                        data: JSON.stringify({
                            userId: userId,
                        }),
                        dataType: 'json',
                        timeout: sessionStorage.getItem("timeInetrval"),
                        context: self,
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            let popup = document.getElementById("deleteMsg");
                            popup.close();
                            self.getUsers("activeStaff")
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

                self.tabData = [
                    { id: "activeStaff", label: "Active Staffs" },
                    { id: "deactiveStaff", label: "Deactived Staffs" },
                ];

                self.selectedTab = ko.observable("activeStaff");
                self.selectedTabAction = ko.computed(() => {   
                    let addButton = document.getElementById("addButton");  
                    if(self.selectedTab()=="deactiveStaff"){
                        addButton.style.display = "none";
                        activeCount.style.display = "none";
                    }
                    else{
                        if(addButton!=null){
                            addButton.style.display = "block";
                            activeCount.style.display = "block";
                        }
                    }
                    self.getUsers(self.selectedTab())
                });

                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        app.onAppSuccess();
                        self.getOfficess();
                        self.getStaffCount();
                    }
                }

                self.getStaffCount = (office)=>{
                    $.ajax({
                        url: BaseURL+"/getManagerStaffCount",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: self.userOfficeId(),
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                                console.log(data)
                                self.activeStaffCount(data[0].active_count)
                                self.inactiveStaffCount(data[0].inactive_count)
                        }
                    })
                }


            }
        }
        return  ManagerUsers;
    }
);