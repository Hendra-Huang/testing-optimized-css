function Init() {
  var tabData = {};
  var q = 36;

  chrome.contentSettings.javascript.set({'primaryPattern': '<all_urls>', 'setting': 'block'}, function() {
    for (var i = q; i <= q; i++) {
      (function(i) {
        //chrome.tabs.create({'url': 'http://documents/skripsi/source/a.html?'+i}, function(sourceTab) {
        chrome.tabs.create({'url': 'http://documents/skripsi/filtered-source/'+i+'/index.html'}, function(sourceTab) {
          tabData[sourceTab.id] = {type: 'source', id: i};
        });
        //chrome.tabs.create({'url': 'http://documents/skripsi/optimized/a.html?'+i}, function(optimizedTab) {
        chrome.tabs.create({'url': 'http://documents/skripsi/revision/'+i+'/index.html'}, function(optimizedTab) {
          tabData[optimizedTab.id] = {type: 'optimized', id: i};
        });
      })(i);
    }
  });

  var sourceComputedRulesStorage = {},
    optimizedComputedRulesStorage = {}
  ;

  chrome.runtime.onMessage.addListener(function(message, sender, response) {
    if (message.from == 'content' && message.subject == 'finish_loaded') {
      chrome.tabs.sendMessage(sender.tab.id, {from: 'background', subject: 'getComputedRules'}, function() {
        var computedRules = computedRules;

        return function(response) {
          var data = tabData[sender.tab.id];
          nodes = response.b;
          response = response.a;

          if (data) {
            var key = '',
              value = '',
              isComplete = false
            ;

            if (data.type == 'source') {
              sourceComputedRulesStorage[data.id] = response;
              if (optimizedComputedRulesStorage[data.id] !== undefined) {
                isComplete = true;
              }
            } else if (data.type == 'optimized') {
              optimizedComputedRulesStorage[data.id] = response;
              if (sourceComputedRulesStorage[data.id] !== undefined) {
                isComplete = true;
              }
            }

            if (isComplete) {
              var sourceComputedRules = sourceComputedRulesStorage[data.id],
                optimizedComputedRules = optimizedComputedRulesStorage[data.id],
                tp = 0,
                tn = 0,
                fp = 0
              ;

              for (var i = 0; i < sourceComputedRules.length; i++) {
                var sourceProperties = sourceComputedRules[i],
                  optimizedProperties = optimizedComputedRules[i]
                ;

                if (sourceProperties && optimizedProperties) {
                  //sourceProperties.effective.forEach(function(sourceProperty) {
                    //if (optimizedProperties.effective.indexOf(sourceProperty) == -1) {
                      //fp++;

                      //console.log(nodes[i]);
                      //console.log(sourceProperties);
                      //console.log(optimizedProperties);
                    //} else {
                      //tn++;
                    //}
                  //});

                  //sourceProperties.overridden.forEach(function(sourceProperty) {
                    //if (optimizedProperties.overridden.indexOf(sourceProperty) == -1) {
                      //tp++;
                    //} else {
                      //tn++;
                    //}
                  //});
                  sourceProperties.effective.forEach(function(sourceProperty) {
                    var filteredProperties = optimizedProperties.effective.filter(function(property) {
                      return property.indexOf(sourceProperty) === -1 ? false : true;
                    });
                    if (filteredProperties.length === 0) {
                      fp++;

                      //console.log(nodes[i]);
                      //console.log(sourceProperties);
                      //console.log(optimizedProperties);
                    } else {
                      tn++;
                    }
                  });

                  sourceProperties.overridden.forEach(function(sourceProperty) {
                    var filteredProperties = optimizedProperties.overridden.filter(function(property) {
                      return property.indexOf(sourceProperty) === -1 ? false : true;
                    });
                    if (filteredProperties.length === 0) {
                      tp++;
                    } else {
                      tn++;
                    }
                  });
                }

                //if (sourceComputedRule) {
                  //for (var media in sourceComputedRule) {
                    //if(!sourceComputedRule.hasOwnProperty(media)) { continue; }

                    //var sourceProperties = sourceComputedRule[media],
                      //optimizedProperties = optimizedComputedRule[media]
                    //;

                    //sourceProperties.effective.forEach(function(sourceProperty) {
                      //if (optimizedProperties.effective.indexOf(sourceProperty) == -1) {
                        //fp++;
                      //} else {
                        //tn++;
                      //}
                    //});

                    //sourceProperties.overridden.forEach(function(sourceProperty) {
                      //if (optimizedProperties.overridden.indexOf(sourceProperty) == -1) {
                        //tp++;
                      //} else {
                        //tn++;
                      //}
                    //});
                  //}
                //}
              }

              localStorage.setItem(data.id, tp + ';' + tn + ';' + fp);
              console.log(data.id + ',' + localStorage[data.id]);

              var sourceTabId, optimizedTabId;
              for (var key in tabData) {
                if (tabData.hasOwnProperty(key)) {
                  var _data = tabData[key];

                  if (_data.type === 'source' && _data.id === data.id) {
                    sourceTabId = key;
                  } else if (_data.type === 'optimized' && _data.id === data.id) {
                    optimizedTabId = key;
                  }
                }
              }
              chrome.tabs.remove(Number.parseInt(sourceTabId, 10));
              chrome.tabs.remove(Number.parseInt(optimizedTabId, 10));
            }
          }
        }
      }());
    }
  });
};
