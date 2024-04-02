define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider",
    "ojs/ojlistdataproviderview","ojs/ojdataprovider", "ojs/ojkeyset",
    "ojs/ojinputtext", "ojs/ojformlayout", "ojs/ojvalidationgroup", "ojs/ojselectsingle", 
    "ojs/ojtable", "ojs/ojinputsearch", "ojs/ojmenu"], 
    function (oj,ko,$, app, ArrayDataProvider, ListDataProviderView, ojdataprovider_1, ojkeyset_1) {

        class Students {
            constructor(args) {
                var self = this;
                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL")
                
                self.officeId = ko.observable();
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));
                self.userId = ko.observable();
                if(self.userRole()=="admin" || self.userRole()=="director"){
                    self.officeId("All")
                    self.userId("All")
                }
                else if(self.userRole()=="manager"){
                    self.officeId(sessionStorage.getItem("userOfficeId"));
                    self.userId("All")
                }
                else{
                    self.officeId(sessionStorage.getItem("userOfficeId"));
                    self.userId(sessionStorage.getItem("userId"))
                }

                self.year = ko.observable(sessionStorage.getItem("selectYear"));
                
                self.studentsCnt = ko.observable();

                self.studentData = ko.observableArray();

                self.offices = ko.observableArray();
                self.blob = ko.observable();
                self.fileName = ko.observable();

                self.getOffices = ()=>{
                    $.ajax({
                        url: BaseURL+"/getOffices",
                        type: 'GET',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.offices([]);
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.offices.push({value: `All`, label: `All`})
                                for(let i=0;i<len;i++){
                                    self.offices.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                                if(self.userRole()=="admin" || self.userRole()=="director"){
                                    self.officeId("All")
                                }
                                else{
                                    self.officeId(sessionStorage.getItem("userOfficeId"));
                                }
                            }
                        }
                    })
                }
                self.officesDP = new ArrayDataProvider(self.offices, {
                    keyAttributes: 'value'
                });

                self.getAllStudents = (selectval, officeId)=>{
                    $.ajax({
                        url: BaseURL+"/getSelectedData",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: officeId,
                            userId: self.userId(),
                            selectVal: selectval,
                            year: self.year()
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            console.log(data)
                            self.studentData([]);
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.studentsCnt(len)
                                var csvContent = '';
                                var headers = ['Student Id', 'First Name', 'Last Name', 'Email', 'Phone', 'Counselor', 'Office', 'Source', 'Note', 'Note Date'];
                                csvContent += headers.join(',') + '\n';
                                for(var i=0;i<len;i++){
                                    const noteDate = new Date(data[i][10])
                                    const year = noteDate.getFullYear();
                                    const month = String(noteDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
                                    const day = String(noteDate.getDate()).padStart(2, '0');
                                    const customDateFormat = `${day}/${month}/${year}`;

                                    self.studentData.push({
                                        id: data[i][0],
                                        firstName: data[i][1],
                                        lastName: data[i][2],
                                        email: data[i][3],
                                        phone: data[i][4],
                                        dob: data[i][5],
                                        counselor: data[i][6],
                                        office: data[i][7],
                                        source: data[i][8],
                                        note: data[i][9],
                                        noteDate: customDateFormat,
                                    });
                                    var rowData = [data[i][0], data[i][1], data[i][2], data[i][3], data[i][4], data[i][6], data[i][7], data[i][8], data[i][9], data[i][10]]; 
                                    csvContent += rowData.join(',') + '\n';
                                }
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Student_Detail' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.blob(blob);
                                self.fileName(fileName);
                            }
                            else{
                                self.studentsCnt(0)
                                var csvContent = '';
                                var headers = ['Student Id', 'First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth', 'Counselor', 'Office', 'Source'];
                                csvContent += headers.join(',') + '\n';
                                var rowData = []; 
                                csvContent += rowData.join(',') + '\n';
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Student_Detail' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.blob(blob);
                                self.fileName(fileName);
                            }
                        }
                    })
                }

                self.viewProfile = (e)=>{
                    // window.location.href = `/?ojr=studentProfile&id=${e.currentTarget.id}`;
                    window.open(`/?ojr=studentProfile&id=${e.currentTarget.id}`, "_blank");
                }

                self.selectList = ko.observable("all");

                if(self.userRole()=="counselor"){
                    self.list = [
                        { value: 'all', label: 'All' },
                        { value: 'assigned', label: 'Assigned Leads' },
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'SPAM', label: 'SPAM' },
                        { value: 'Offer Received', label: 'Offer Received' },
                        { value: 'Deposit Paid', label: 'Deposit Paid' },
                        { value: 'Visa Grant', label: 'Visa Grant' },
                        { value: 'Not Interested', label: 'Not Interested' },
                        { value: 'Rejected', label: 'Rejected' },
                        { value: 'closed', label: 'Closed' }
                    ];
                }
                else{
                    self.list = [
                        { value: 'all', label: 'All' },
                        { value: 'unAssigned', label: 'Unassigned Leads' },
                        { value: 'assigned', label: 'Assigned Leads' },
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'SPAM', label: 'SPAM' },
                        { value: 'Offer Received', label: 'Offer Received' },
                        { value: 'Deposit Paid', label: 'Deposit Paid' },
                        { value: 'Visa Grant', label: 'Visa Grant' },
                        { value: 'Not Interested', label: 'Not Interested' },
                        { value: 'Rejected', label: 'Rejected' },
                        { value: 'closed', label: 'Closed' }
                    ];
                }
                
                self.listDP = new ArrayDataProvider(self.list, {
                    keyAttributes: 'value'
                });

                self.selectedData = (e)=>{
                    let selectVal = e.detail.value;
                    self.getAllStudents(selectVal, self.officeId())
                }

                // self.officeSelectedData = (e)=>{
                    
                // }

                self.officeAction = (e)=>{                    
                    let selectOffice = e.detail.value;
                    self.getAllStudents(self.selectList(), selectOffice)
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
                            comparators: new Map().set("dob", this.comparator),
                        },
                    });
                    
                    return new ListDataProviderView(arrayDataProvider, { filterCriterion: filterCriterion });
                }, self);

                self.handleValueChanged = () => {
                    self.filter(document.getElementById('filter').rawValue);
                };

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
                        self.getOffices()
                        self.getAllStudents("All", self.officeId())
                    }
                }
            }
        }
        return  Students;
    }
);