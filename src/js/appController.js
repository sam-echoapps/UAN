define(["knockout","ojs/ojcontext", "ojs/ojmodule-element-utils", "ojs/ojknockouttemplateutils", "ojs/ojcorerouter",
      "ojs/ojmodulerouter-adapter", "ojs/ojknockoutrouteradapter", "ojs/ojurlparamadapter", "ojs/ojresponsiveutils",
      "ojs/ojresponsiveknockoututils", "ojs/ojarraydataprovider", "ojs/ojarraytreedataprovider",
      "ojs/ojpopup", "ojs/ojprogress-circle", "ojs/ojdrawerpopup", "ojs/ojmodule-element", "ojs/ojknockout", "ojs/ojdrawerlayout",
      "ojs/ojaccordion", "ojs/ojlistview", "ojs/ojlistitemlayout",
], function (ko, Context, moduleUtils, KnockoutTemplateUtils, CoreRouter, ModuleRouterAdapter, KnockoutRouterAdapter, UrlParamAdapter,
              ResponsiveUtils, ResponsiveKnockoutUtils, ArrayDataProvider, ArrayTreeDataProvider) {
  function ControllerViewModel() {
    this.KnockoutTemplateUtils = KnockoutTemplateUtils;
    this.manner = ko.observable("polite");
    this.message = ko.observable();
    self.username = ko.observable();
    self.BaseUrl = ko.observable();
    self.onepDeployList = ko.observableArray([]);

    announcementHandler = (event) => {
      this.message(event.detail.message);
      this.manner(event.detail.manner);
    };

    document
      .getElementById("globalBody")
      .addEventListener("announce", announcementHandler, false);

    // Media queries for repsonsive layouts
    const smQuery = ResponsiveUtils.getFrameworkQuery(
      ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY
    );
    this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
    const mdQuery = ResponsiveUtils.getFrameworkQuery(
      ResponsiveUtils.FRAMEWORK_QUERY_KEY.MD_UP
    );
    this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

    this.selectedItem = ko.observable('dashboard');
    
    if (sessionStorage.getItem("userRole") == "admin" || sessionStorage.getItem("userRole") == "director") {
      var navData = [
        { path: "", redirect: "signin" },
        { path: "signin", detail: { label: "Signin", iconClass: "oj-ux-ico-bar-chart" },},
        { path: "student-register", detail: { label: "Student Register", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "studentProfile", detail: { label: "Student Profile", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "students", detail: { label: "Students", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "application", detail: { label: "Application", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "finalchoiced", detail: { label: "Finalchoiced", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "unAssigned", detail: { label: "UnAssigned", iconClass: "oj-ux-ico-bar-chart", },},
        { path: "managerDashboard", detail: { label: "Manager Dashboard", iconClass: "fa-solid fa-gauge", }, },
        { path: "counsellorDashboard", detail: { label: "Counsellor Dashboard", iconClass: "fa-solid fa-gauge", }, },
        { path: "dashboard", detail: { label: "Dashboard", iconClass: "fa-solid fa-gauge" }, },
        { path: "partnerDashboard", detail: { label: "Dashboard", iconClass: "fa-solid fa-gauge" }, },
        { path: "addStudent", detail: { label: "Add Student", iconClass: "fa-solid fa-user-plus"},},
        { path: "bulkStudentAdd", detail: { label: "Bulk Student Add", iconClass: "oj-ux-ico-bar-chart", },},
        { path: "searchStudent", detail: { label: "Search Student", iconClass: "fa-solid fa-magnifying-glass", }, },
        { path: "manageUsers", detail: { label: "Manage Staff", iconClass: "fa-solid fa-people-roof", }, },
        { path: "manageOffice", detail: { label: "Manage Office", iconClass: "fa-regular fa-building", }, },
        { path: "applicationReport", detail: { label: "Application Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "finalChoiceReport", detail: { label: "Final Choice Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "studentManagerReport", detail: { label: "Student Manager Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "studentLogReport", detail: { label: "Student Log Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "missedReminder", detail: { label: "Missed Reminder Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "applicantReport", detail: { label: "Applicant Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "staffApplication", detail: { label: "Staff Application Submission", iconClass: "fa-solid fa-people-roof", }, },
        { path: "freeCounseling", detail: { label: "Free Counseling", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "reAssignStudents", detail: { label: "Reassign Students", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "help", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "guideManageStudents", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "guideManageoffice", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "guideManageStaff", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "guideManageReport", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "institutionProfile", detail: { label: "Institution Profile", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "institutionList", detail: { label: "Institution List", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "addPartner", detail: { label: "Partners", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "partnerProfile", detail: { label: "Partner Profile", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "partnerCommission", detail: { label: "Partner Commission", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "partnerReport", detail: { label: "Partner Report", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "searchPartnerStudent", detail: { label: "Search Student", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "partnerStudentManagerReport", detail: { label: "Student Manager Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "partnerStudentProfile", detail: { label: "Student Profile", iconClass: "oj-ux-ico-bar-chart", }, },
      ];
    } else if (sessionStorage.getItem("userRole") == "manager") {
      var navData = [
        { path: "", redirect: "signin" },
        { path: "signin", detail: { label: "Signin", iconClass: "oj-ux-ico-bar-chart" }, },
        { path: "student-register", detail: { label: "Student Register", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "studentProfile", detail: { label: "Student Profile", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "students", detail: { label: "Students", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "application", detail: { label: "Application", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "finalchoiced", detail: { label: "Finalchoiced", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "unAssigned", detail: { label: "UnAssigned", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "counsellorDashboard", detail: { label: "Counsellor Dashboard", iconClass: "fa-solid fa-gauge", }, },
        { path: "dashboard", detail: { label: "Dashboard", iconClass: "fa-solid fa-gauge" }, },
        { path: "manageUsers", detail: { label: "Manage Staff", iconClass: "fa-solid fa-people-roof", }, },
        { path: "manageOffice", detail: { label: "Manage Office", iconClass: "fa-regular fa-building", }, },
        { path: "managerDashboard", detail: { label: "Dashboard", iconClass: "fa-solid fa-gauge" }, },
        { path: "partnerDashboard", detail: { label: "Dashboard", iconClass: "fa-solid fa-gauge" }, },
        { path: "addStudent", detail: { label: "Add Student", iconClass: "fa-solid fa-user-plus" }, },
        { path: "bulkStudentAdd", detail: { label: "Bulk Student Add", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "searchStudent", detail: { label: "Search Student", iconClass: "fa-solid fa-magnifying-glass", }, },
        { path: "applicationReport", detail: { label: "Application Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "finalChoiceReport", detail: { label: "Final Choice Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "studentManagerReport", detail: { label: "Student Manager Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "studentLogReport", detail: { label: "Student Log Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "missedReminder", detail: { label: "Missed Reminder Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "applicantReport", detail: { label: "Applicant Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "staffApplication", detail: { label: "Staff Application Submission", iconClass: "fa-solid fa-people-roof", }, },
        { path: "freeCounseling", detail: { label: "Free Counseling", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "reAssignStudents", detail: { label: "Reassign Students", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "help", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "guideManageStudents", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "guideManageoffice", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "guideManageStaff", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "guideManageReport", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "searchPartnerStudent", detail: { label: "Search Student", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "partnerStudentManagerReport", detail: { label: "Student Manager Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "partnerStudentProfile", detail: { label: "Student Profile", iconClass: "oj-ux-ico-bar-chart", }, },
      ];
    } else if (sessionStorage.getItem("userRole") == "partner") {
      var navData = [
        { path: "", redirect: "signin" },
        { path: "signin", detail: { label: "Signin", iconClass: "oj-ux-ico-bar-chart" }, },
        { path: "partnerDashboard", detail: { label: "Dashboard", iconClass: "fa-solid fa-gauge" }, },
        { path: "managerDashboard", detail: { label: "Manager Dashboard", iconClass: "fa-solid fa-gauge", }, },
        { path: "counsellorDashboard", detail: { label: "Counsellor Dashboard", iconClass: "fa-solid fa-gauge", }, },
        { path: "dashboard", detail: { label: "Dashboard", iconClass: "fa-solid fa-gauge" }, },
        { path: "addStudent", detail: { label: "Add Student", iconClass: "fa-solid fa-people-roof", }, },
        { path: "searchPartnerStudent", detail: { label: "Search Student", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "studentProfile", detail: { label: "Student Profile", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "partnerStudentManagerReport", detail: { label: "Student Manager Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "partnerStudentProfile", detail: { label: "Student Profile", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "guideManageReport", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "finalChoiceReport", detail: { label: "Final Choice Report", iconClass: "fa-solid fa-people-roof", }, },        
      ];
    } else {
      var navData = [
        { path: "", redirect: "signin" },
        { path: "signin", detail: { label: "Signin", iconClass: "oj-ux-ico-bar-chart" }, },
        { path: "student-register", detail: { label: "Student Register", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "studentProfile", detail: { label: "Student Profile", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "students", detail: { label: "Students", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "application", detail: { label: "Application", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "finalchoiced", detail: { label: "Finalchoiced", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "dashboard", detail: { label: "Dashboard", iconClass: "fa-solid fa-gauge" }, },
        { path: "managerDashboard", detail: { label: "Manager Dashboard", iconClass: "fa-solid fa-gauge", }, },
        { path: "manageUsers", detail: { label: "Manage Staff", iconClass: "fa-solid fa-people-roof", }, },
        { path: "manageOffice", detail: { label: "Manage Office", iconClass: "fa-regular fa-building", }, },
        { path: "counsellorDashboard", detail: { label: "Dashboard", iconClass: "fa-solid fa-gauge" }, },
        { path: "partnerDashboard", detail: { label: "Dashboard", iconClass: "fa-solid fa-gauge" }, },
        { path: "addStudent", detail: { label: "Add Student", iconClass: "fa-solid fa-user-plus" }, },
        { path: "bulkStudentAdd", detail: { label: "Bulk Student Add", iconClass: "oj-ux-ico-bar-chart", }, },
        { path: "searchStudent", detail: { label: "Search Student", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "freeCounseling", detail: { label: "Free Counseling", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "help", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "guideManageStudents", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "guideManageoffice", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "guideManageStaff", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "guideManageReport", detail: { label: "Help", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "searchPartnerStudent", detail: { label: "Search Student", iconClass: "fa-solid fa-magnifying-glass", },},
        { path: "partnerStudentManagerReport", detail: { label: "Student Manager Report", iconClass: "fa-solid fa-people-roof", }, },
        { path: "partnerStudentProfile", detail: { label: "Student Profile", iconClass: "oj-ux-ico-bar-chart", }, },
      ];
    }
    

    self.appName = ko.observable();
    if (sessionStorage.getItem("userRole") == "admin" || sessionStorage.getItem("userRole") == "director") {
      self.navMenu = [
        {"name": "Dashboard","id": "home","icons": "fa-solid fa-gauge", "path":"dashboard"},
        {"name": "Student", "id": "student", "icons": "oj-ux-ico-education", 
          "children": [
            {"name": "Add Student","id": "addStudent","icons": "fa-solid fa-user-plus", "path":"addStudent"},
            {"name": "Bulk Student Add","id": "bulkStudentAdd","icons": "oj-ux-ico-bar-chart", "path":"bulkStudentAdd"},
            {"name": "Search Student","id": "searchStudent","icons": "fa-solid fa-magnifying-glass", "path":"searchStudent"},
            {"name": "Student Manager Report","id": "studentManagerReport","icons": "oj-ux-ico-bar-chart", "path":"studentManagerReport"},
            {"name": "Student Log Report","id": "studentLogReport","icons": "oj-ux-ico-bar-chart", "path":"studentLogReport"},
            {"name": "Reassign Students","id": "reAssignStudents","icons": "oj-ux-ico-bar-chart", "path":"reAssignStudents"},
          ]
        },
        {"name": "Reports", "id": "application", "icons": "oj-ux-ico-bar-chart", 
          "children": [
            {"name": "Application Report","id": "applicationReport","icons": "oj-ux-ico-bar-chart", "path":"applicationReport"},
            {"name": "Final Choice Report","id": "finalChoiceReport","icons": "oj-ux-ico-bar-chart", "path":"finalChoiceReport"},
            {"name": "Missed Reminder Report","id": "missedReminders","icons": "oj-ux-ico-bar-chart", "path":"missedReminder"},
            {"name": "Applicant Report","id": "applicantReport","icons": "oj-ux-ico-bar-chart", "path":"applicantReport"},
            {"name": "Staff Application Submission Report","id": "staffApplication","icons": "oj-ux-ico-bar-chart", "path":"staffApplication"},
          ]
        },
        {"name": "Institution List","id": "institutionList","icons": "fa-solid fa-landmark", "path":"institutionList"},
        {"name": "Institution Profile","id": "institutionProfile","icons": "fa-solid fa-landmark", "path":"institutionProfile"},
        {"name": "Manage Staff","id": "manageUsers","icons": "fa-solid fa-people-roof", "path":"manageUsers"},
        {"name": "Manage Office","id": "manageOffice","icons": "fa-regular fa-building", "path":"manageOffice"},
        {"name": "Partner", "id": "partner", "icons": "fa-solid fa-handshake-angle", 
          "children": [
            {"name": "Partners","id": "addPartner","icons": "fa-solid fa-user-plus", "path":"addPartner"},
            {"name": "Partner Profile","id": "partnerProfile","icons": "fa-solid fa-user", "path":"partnerProfile"},
            // {"name": "Partner Commission","id": "partnerCommission","icons": "fa-solid fa-hand-holding-dollar", "path":"partnerCommission"},
            // {"name": "Partner Report","id": "partnerReport","icons": "oj-ux-ico-bar-chart", "path":"partnerReport"}, 
          ]
        },
        {"name": "Help","id": "help","icons": "fa-solid fa-life-ring", "path":"help"},
      ]
    }
    else if (sessionStorage.getItem("userRole") == "manager") {
      self.navMenu = [
        {"name": "Dashboard","id": "home","icons": "fa-solid fa-gauge", "path":"managerDashboard"},
        {"name": "Student", "id": "student", "icons": "oj-ux-ico-education", 
          "children": [
            {"name": "Add Student","id": "addStudent","icons": "fa-solid fa-user-plus", "path":"addStudent"},
            {"name": "Bulk Student Add","id": "bulkStudentAdd","icons": "oj-ux-ico-bar-chart", "path":"bulkStudentAdd"},
            {"name": "Search Student","id": "searchStudent","icons": "fa-solid fa-magnifying-glass", "path":"searchStudent"},
            {"name": "Student Manager Report","id": "studentManagerReport","icons": "oj-ux-ico-bar-chart", "path":"studentManagerReport"},
            {"name": "Student Log Report","id": "studentLogReport","icons": "oj-ux-ico-bar-chart", "path":"studentLogReport"},
            {"name": "Reassign Students","id": "reAssignStudents","icons": "oj-ux-ico-bar-chart", "path":"reAssignStudents"},
          ]
        },
        {"name": "Reports", "id": "application", "icons": "oj-ux-ico-bar-chart", 
          "children": [
            {"name": "Application Report","id": "applicationReport","icons": "oj-ux-ico-bar-chart", "path":"applicationReport"},
            {"name": "Final Choice Report","id": "finalChoiceReport","icons": "oj-ux-ico-bar-chart", "path":"finalChoiceReport"},
            {"name": "Missed Reminder Report","id": "missedReminders","icons": "oj-ux-ico-bar-chart", "path":"missedReminder"},
            {"name": "Applicant Report","id": "applicantReport","icons": "oj-ux-ico-bar-chart", "path":"applicantReport"},
            {"name": "Staff Application Submission Report","id": "staffApplication","icons": "oj-ux-ico-bar-chart", "path":"staffApplication"},
          ]
        },
        {"name": "Manage Staff","id": "manageUsers","icons": "fa-solid fa-people-roof", "path":"manageUsers"},
        {"name": "Help","id": "help","icons": "fa-solid fa-life-ring", "path":"help"},
      ]
    }
    else if (sessionStorage.getItem("userRole") == "partner") {
      self.navMenu = [
        {"name": "Dashboard","id": "home","icons": "fa-solid fa-gauge", "path":"partnerDashboard"},
        {"name": "Student", "id": "student", "icons": "oj-ux-ico-education", 
          "children": [
            {"name": "Add Student","id": "addStudent","icons": "fa-solid fa-user-plus", "path":"addStudent"},
            {"name": "Search Student","id": "searchPartnerStudent","icons": "fa-solid fa-user-plus", "path":"searchPartnerStudent"},
            {"name": "Student Manager Report","id": "partnerStudentManagerReport","icons": "oj-ux-ico-bar-chart", "path":"partnerStudentManagerReport"},
          ]
        },
      ]
    }
    else{
      self.navMenu = [
        {"name": "Dashboard","id": "home","icons": "fa-solid fa-gauge", "path":"counsellorDashboard"},
        {"name": "Student", "id": "student", "icons": "oj-ux-ico-education", 
          "children": [
            {"name": "Add Student","id": "addStudent","icons": "fa-solid fa-user-plus", "path":"addStudent"},
            {"name": "Bulk Student Add","id": "bulkStudentAdd","icons": "oj-ux-ico-bar-chart", "path":"bulkStudentAdd"},
            {"name": "Search Student","id": "searchStudent","icons": "fa-solid fa-magnifying-glass", "path":"searchStudent"},
          ]
        },
        {"name": "Help","id": "help","icons": "fa-solid fa-life-ring", "path":"help"},
      ]
    }
    
    self.dataProvider = new ArrayTreeDataProvider(self.navMenu, {
      keyAttributes: 'id'
    });

    // Router setup
    let router = new CoreRouter(navData, {
      urlAdapter: new UrlParamAdapter(),
    });
    router.sync();

    this.moduleAdapter = new ModuleRouterAdapter(router);

    this.selection = new KnockoutRouterAdapter(router);

    if (sessionStorage.getItem("userRole") == "admin" || sessionStorage.getItem("userRole") == "director") {
      this.navDataProvider = new ArrayDataProvider(navData.slice(10), {
        keyAttributes: "path",
      });
    }
    else if(sessionStorage.getItem("userRole") == "manager"){
      this.navDataProvider = new ArrayDataProvider(navData.slice(12), {
        keyAttributes: "path",
      });
    }
    else{
      this.navDataProvider = new ArrayDataProvider(navData.slice(11), {
        keyAttributes: "path",
      });
    }
    // Drawer
    self.sideDrawerOn = ko.observable(false);

    // Close drawer on medium and larger screens
    this.mdScreen.subscribe(() => {
      self.sideDrawerOn(false);
    });

    self.userId = ko.observable();
    if(sessionStorage.getItem("userId")){
      self.userId = ko.observable(sessionStorage.getItem("userId"));
    }
    else{
      self.userId("");
    }
    

    this.startOpened = ko.observable(false);
    this.notifyOpened = ko.observable(false);
    this.notifyToggle = () => this.notifyOpened(!this.notifyOpened());
    this.notifyOpenedChangedHandler = (event) => {
      
    };
    
    self.reminderData = ko.observableArray(new Array());
    self.reminderCount = ko.observable();
    $.ajax({
      url: "http://169.197.183.168:9000/getUserReminderNotes",
      type: "POST",
      data: JSON.stringify({
        userId: self.userId(),
      }),
      dataType: "json",
      context: self,
      error: function (e) {},
      success: function (data) {
        if(data[0]!='No data found'){
          data = JSON.parse(data);
          let len = data.length;
          self.reminderCount(len);
          for(var i=0;i<len;i++){
            var created_date = new Date(data[i][4]);
            var year = created_date.getFullYear();
            var month = ('0' + (created_date.getMonth() + 1)).slice(-2);
            var day = ('0' + created_date.getDate()).slice(-2);
            created_date =  `${day}-${month}-${year}`
            var reminder_date = new Date(data[i][3]);
            var year = reminder_date.getFullYear();
            var month = ('0' + (reminder_date.getMonth() + 1)).slice(-2);
            var day = ('0' + reminder_date.getDate()).slice(-2);
            reminder_date =  `${day}-${month}-${year}`
            self.reminderData.push({
              student_id: data[i][1],
              note: data[i][2],
              reminder_date: reminder_date,
              created_date: created_date
            })
          }
        }
        else{
          self.reminderCount(0);
        }
      },
    }); 
    
    this.reminderDataProvider = new ArrayDataProvider(self.reminderData, {
      keyAttributes: 'id'
    });

    self.viewProfile = (e)=>{
      window.open(`/?ojr=studentProfile&id=${e.currentTarget.id}`, "_blank");
    }
    // Called by navigation drawer toggle button and after selection of nav drawer item
    this.toggleDrawer = () => {
      self.sideDrawerOn(!self.sideDrawerOn());
    };

    // Header
    // Application Name used in Branding Area
    this.appName = ko.observable("UAN");
    // User Info used in Global Navigation area
    this.userLogin = ko.observable("john.hancock@oracle.com");

    this.startOpened = ko.observable(false);
    this.endOpened = ko.observable(false);
    this.startToggle = () => this.startOpened(!this.startOpened());
    this.endToggle = () => this.endOpened(!this.endOpened());

    self.goToPage = (e)=>{
      if(e.currentTarget.id!=""){
        router.go({path : e.currentTarget.id});
        this.startOpened(!this.startOpened())
      }
    }

    self.SignIn = ko.observable("N");

    self.userRole = ko.observable();

    self.logOut = () => {
      sessionStorage.clear();
      self.goToSignIn();
    };

    self.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);

    self.menuItemAction = function (event, vm) {
      self.selectedMenuItem(event.target.value);
      if (self.selectedMenuItem() == "out") {
        self.username("");
        sessionStorage.clear();
        event.preventDefault();
        self.goToSignIn();
      } else if (self.selectedMenuItem() == "seldep") {
        document.querySelector("#RemoteDeploymentDialog").open();
        self.onepDeployList([]);
        $.ajax({
          url: "http://169.197.183.168:9000/onepdep",
          type: "GET",
          dataType: "json",
          context: self,
          error: function (e) {},
          success: function (data) {
            for (var i = 0; i < data[0].length; i++) {
              self.onepDeployList.push({
                label: data[0][i].dep,
                value: data[0][i].dep,
              });
            }
            self.onepDeployList.valueHasMutated();
            return self;
          },
        });
      } else if (self.selectedMenuItem() == "about") {
        document.querySelector("#abtDialog").open();
      } else if (self.selectedMenuItem() == "help") {
        document.querySelector("#helpDialog").open();
      }
    };

    ControllerViewModel.prototype.onAppSuccess = function () {
      self.username(sessionStorage.getItem("userName"));
      self.BaseUrl(sessionStorage.getItem("BaseURL"));
      self.userRole(sessionStorage.getItem("userRole"));
      self.SignIn("Y");
      self.appName("UAN");
    };

    ControllerViewModel.prototype.onLoginSuccess = function () {
      if (sessionStorage.getItem("userRole") == "admin" || sessionStorage.getItem("userRole") == "director") {
        router.go({ path: "dashboard" });
      } else if (sessionStorage.getItem("userRole") == "manager") {
        router.go({ path: "managerDashboard" });
      }else if (sessionStorage.getItem("userRole") == "partner") {
        router.go({ path: "partnerDashboard" });
      } else {
        router.go({ path: "counsellorDashboard" });
      }
    };

    self.goToSignIn = function () {
      router.go({ path: "signin" });
      self.SignIn("N");
    };
  }
  // release the application bootstrap busy state
  Context.getPageContext().getBusyContext().applicationBootstrapComplete();

  return new ControllerViewModel();
});
