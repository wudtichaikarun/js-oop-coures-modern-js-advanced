var MAINAPP = (function(nsp, $, domU, strU) {
  /*
    Quiz Functionality
    */
  var contentObj = {},
    questionsArray = [],
    navigationProto = {}, //Setup in setUpNavigation()
    prevBtn,
    nextBtn;

  var loadJSON = function(path) {
      var xobj = new XMLHttpRequest();
      xobj.overrideMimeType("application/json");
      xobj.open("GET", path);
      xobj.onreadystatechange = function() {
        if (xobj.readyState === 4) {
          // ----- 1. load data from mock data set to object contentObj ------
          contentObj = JSON.parse(xobj.responseText);
          //console.log(contentObj);
          // ----- 1.1 sent contentObj to method parseData()
          parseData(contentObj);
        }
      };
      xobj.send(null);
    },
    parseData = function(cObj) {
      // 2. set contentObjct.questions to array questionsArray
      questionsArray = cObj.questions;
      //set button text
      domU.setHTML($(".fill-in-submit"), cObj.buttonText);

      for (let i = 0; i < questionsArray.length; i++) {
        /** 2.1 inheritance properties and method for each questionArray
         * using funtion constructor Question
         **/
        questionsArray[i] = new Question(questionsArray[i]);
      }
      console.log("parseData: ", questionsArray);
      // 3. show question on html dom
      //   questionsArray[0].populateTheQuestion();
      //   questionsArray[0].displayQuestion();
      setUpNavigation();
    },
    initQuiz = function() {
      loadJSON("../JSON/content.json");
    };

  /*
    Setup Question Function Constructor
  */
  var Question = function(obj) {
    //Transfer Data
    this.questionDiv = obj.type === "true-false" ? "multi-choice" : obj.type;

    // this.type = obj.type;
    // this.id = obj.id;
    // this.questionText = obj.questionText;
    // this.distractors = obj.distractors;
    // this.correctResp = obj.correctResp;
    // this.feedback = obj.feedback;
    // this.weight = obj.weight;

    // loop create properties
    for (let key in obj) {
      this[key] = obj[key];
    }

    this.result = "no-answer";
    this.studentResp = "";
    this.correct = false;

    //Assign DOM elements
    htmlDiv = $("#" + this.questionDiv)[0];
    this.questionField = htmlDiv.querySelector(".question-text");
    this.noAnswerFeed = htmlDiv.querySelector(".feedback.no-answer");
    this.correctFeed = htmlDiv.querySelector(".feedback.correct");
    this.inccorrectFeed = htmlDiv.querySelector(".feedback.incorrect");
    this.htmlDiv = htmlDiv;

    switch (this.questionDiv) {
      case "fill-in":
        this.populateTheQuestion = function() {
          // invoked method from the prototype
          this.populateQuestion();
          // htmlDiv is closuer. Clear message in textarea.
          htmlDiv.querySelector("textarea").value = "";
        };
        this.checkTheAnswer = function() {
          console.log("fill-in");
          var ans,
            value = htmlDiv.querySelector("textarea").value;

          if (value !== "") {
            ans = strU.breakOut(this.correctResp, ",");
            // check answer return true or false
            this.correct = ans.every(function(val) {
              return value.indexOf(val) > -1;
            });
            this.result = this.correct ? "correct" : "incorrect";
          }
          this.hideFeedback();
          this.displayFeedback();
        };
        break;
      case "multi-choice":
        var distractors = htmlDiv.querySelectorAll("label"),
          distractorsRadio = htmlDiv.querySelectorAll("input");

        this.populateTheQuestion = function() {
          this.populateQuestion();
          domU.addClass(distractors, "remove");
          for (let i = 0; i < distractors.length; i++) {
            if (this.distractors[i] !== undefined) {
              distractors[i].innerHTML = this.distractors[i];
              domU.removeClass([distractors[i]], "remove");
            }
          }
          for (let i = 0; i < distractorsRadio.length; i++) {
            distractorsRadio[i].checked = false;
          }
        };
        this.checkTheAnswer = function() {
          console.log("multi-choice");

          for (let i = 0; i < distractors.length; i++) {
            if (distractorsRadio[i].checked) {
              this.studentResp = $(
                "#" + distractorsRadio[i].id + "_label"
              )[0].innerHTML;
            }
          }
          if (this.studentResp !== "") {
            this.correct = this.studentResp === this.correctResp;
            this.result = this.correct ? "correct" : "incorrect";
          }
          this.hideFeedback();
          this.displayFeedback();
        };
        break;
      default:
        this.populateTheQuestion = function() {
          this.populateQuestion();
        };
        break;
    }
  };

  /** Add method to prototype of function constructor */
  Question.prototype.displayQuestion = function() {
    // bind this for checkTheAnswer method
    var checkTheAnswer = this.checkTheAnswer.bind(this);

    domU.removeClass([this.htmlDiv], "hidden-question");
    domU.assignEvent(
      this.htmlDiv.querySelectorAll(".fill-in-submit.btn-primary"),
      "click",
      function() {
        // don't need to use this.checkTheAnswer because i usind(this)
        checkTheAnswer();
      }
    );
  };
  Question.prototype.hideQuestion = function() {
    domU.addClass([this.htmlDiv], "hidden-question");
  };
  Question.prototype.populateQuestion = function() {
    //Set Question text
    this.questionField.innerHTML = this.questionText;
    this.noAnswerFeed.innerHTML =
      "<p><span>X </span>" + this.feedback.noAnswer + "</p>";
    this.correctFeed.innerHTML =
      "<p><span>&#10003 </span>" + this.feedback.correctAnswer + "</p>";
    this.inccorrectFeed.innerHTML =
      "<p><span>X </span>" + this.feedback.wrongAnswer + "</p>";
  };
  Question.prototype.hideFeedback = function() {
    var feedback = this.htmlDiv.querySelectorAll(".feedback.visible");
    domU.removeClass(feedback, "visible");
  };
  Question.prototype.displayFeedback = function() {
    var feedback = $(".feedback." + this.result);
    domU.addClass(feedback, "visible");
  };
  Question.prototype.checkAnswer = function() {};

  /**
   * SETUP NAVIGATION OBJECT
   */
  var setUpNavigation = function() {
    var cQuestion = 0;
    navigationProto = {
      questionsArray: questionsArray,
      totalQuestions: questionsArray.length,
      hideQuestion: function() {
        var curQuestion = this.questionsArray[this.currentQuestion];
        curQuestion.hideQuestion();
      },
      showQuestion: function() {
        var newQuestion = this.questionsArray[this.currentQuestion];
        newQuestion.hideFeedback();
        newQuestion.populateTheQuestion();
        newQuestion.displayQuestion();
      },
      get currentQuestion() {
        return cQuestion;
      },
      set currentQuestion(value) {
        cQuestion = value;
      }
    };

    nextBtn = Object.create(navigationProto);
    nextBtn.goNext = function(e) {
      if (this.currentQuestion < this.totalQuestions - 1) {
        this.hideQuestion();
        this.currentQuestion = this.currentQuestion + 1;
        this.showQuestion();
      }
    };

    prevBtn = Object.create(navigationProto);
    prevBtn.goPrev = function(e) {
      if (this.currentQuestion > 0) {
        this.hideQuestion();
        this.currentQuestion = this.currentQuestion - 1;
        this.showQuestion();
      }
    };

    $(".btn-prev")[0].addEventListener("click", function(e) {
      prevBtn.goPrev(e);
    });

    $(".btn-next")[0].addEventListener("click", function(e) {
      nextBtn.goNext(e);
    });

    navigationProto.showQuestion();

    nsp.prevBtn = prevBtn;
    nsp.nextBtn = nextBtn;
  };

  /**
   * SETUP
   */
  UTIL.domReady(function() {
    initQuiz();
  });

  //Public Methods and Properties
  nsp.initQuiz = initQuiz;

  return nsp;
})(MAINAPP || {}, UTIL.dom.$, UTIL.dom, UTIL.string);
