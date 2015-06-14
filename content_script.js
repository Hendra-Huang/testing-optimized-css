//CSSUtilities.define('mode', 'author');
//CSSUtilities.define('async', false);
//CSSUtilities.define('attributes', false);

chrome.runtime.onMessage.addListener(function(message, sender, response) {
  if (message.from == 'background' && message.subject == 'getComputedRules') {
    var subject = message.subject,
      stack = [document.querySelector('body'), document.querySelector('html')],
      computedRules = []
    ;
    var nodes = [];

    NodeList.prototype.forEach = Array.prototype.forEach;
    while (stack.length > 0) {
      var node = stack.pop(),
        matchedRules
      ;

      if (node.childElementCount > 0 && node.tagName != 'HTML') {
        node.childNodes.forEach(function(child) {
          if (child.nodeType === 1 && child.nodeName !== 'SCRIPT' && child.nodeName !== 'LINK') {
            stack.push(child);
          }
        });
      }

      //matchedRules = getMatchedRules(CSSUtilities.getCSSRules(
        //node, 
        //'*', 
        //'selector,properties,inheritance,media,specificity,href,index', 
        //true
      //));
      //computedRules.push(matchedRules);

      var nodeText = node.attributes[0] ? node.attributes[0].nodeName + '=' + node.attributes[0].nodeValue : '-';
      nodes.push(node.nodeName + ' ' + nodeText);
      var cssRules = window.getMatchedCSSRules(node),
        effectiveProperties = [],
        effectivePropertyKeys = [],
        overriddenProperties = []
      ;
      //start from the back because the most specific start from the back
      if (cssRules) {
        for (var i = cssRules.length-1; i >= 0; i--) {
          var cssRule = cssRules[i],
            stringProperties = cssRule.cssText.match(/\{(.*)\}/)[1],
            properties = stringProperties.split('; ').map(function(property) { 
              return property.trim() ? property.trim() : undefined;
            })
          ;

          properties.forEach(function(property) {
            if (property) {
              var key = property.split(':')[0],
                isImportant = property.indexOf('!important') === -1 ? false : true
              ;
              //property = property.replace(/url\(.*\)|\!important/, '');

              //if (effectivePropertyKeys.indexOf(key) === -1) {
                //effectivePropertyKeys.push(key);
                //effectiveProperties.push(property);
              //} else {
                //var tempProperty;

                //if (isImportant) {
                  //tempProperty = effectiveProperties.filter(function(property) {
                    //return property.indexOf(key) === -1 ? false : true;
                  //});
                  //effectiveProperties.splice(effectiveProperties.indexOf(tempProperty[0]), 1);
                  //effectiveProperties.push(property);
                  //overriddenProperties.push(tempProperty[0]);
                //} else {
                  //overriddenProperties.push(property);
                //}
              //}
              property = property.replace(/url\(.*\)/, '');

              if (effectivePropertyKeys.indexOf(key) === -1) {
                // jika ada style color ..
                if (key.search(/\-(style|width|color)/) !== -1) {
                  var subKey = key.replace(/\-(style|width|color)/, '');
                  if (effectivePropertyKeys.indexOf(subKey) !== -1 || effectivePropertyKeys.indexOf(subKey+'-width') !== -1) {
                    overriddenProperties.push(property);
                  } else {
                    effectivePropertyKeys.push(key);
                    effectiveProperties.push(property);
                  }
                  return;
                }
                // jika ada top bottom ..
                if (key.search(/\-(top|right|left|bottom)/) === -1) {
                  effectivePropertyKeys.push(key);
                  effectiveProperties.push(property);
                } else {
                  var subKey = key.replace(/\-(top|right|left|bottom)/, '');
                  if (effectivePropertyKeys.indexOf(subKey) === -1) {
                    effectivePropertyKeys.push(key);
                    effectiveProperties.push(property);
                  } else {
                    overriddenProperties.push(property);
                  }
                  return;
                }
              } else {
                var tempProperty;

                if (isImportant) {
                  tempProperty = effectiveProperties.filter(function(property) {
                    return property.indexOf(key) === -1 ? false : true;
                  });
                  if (tempProperty[0].search(/\!important/) === -1) {
                    effectiveProperties.splice(effectiveProperties.indexOf(tempProperty[0]), 1);
                    effectiveProperties.push(property);
                    overriddenProperties.push(tempProperty[0]);
                  } else {
                    overriddenProperties.push(property);
                  }
                } else {
                  overriddenProperties.push(property);
                }
              }
            }
          });
        }

        computedRules.push({effective: effectiveProperties, overridden: overriddenProperties});
      } else {
        computedRules.push({effective: [], overridden: []});
      }
    }

    response({a: computedRules, b: nodes});

    function getMatchedRules(rules) {
      rules.sort(function(a, b) {
        if (a.inheritance.length == b.inheritance.length) {
          if (a.specificity.toString() === b.specificity.toString()) { 
            return a.index - b.index; 
          }
          
          if (a.specificity[0] !== b.specificity[0]) { return a.specificity[0] - b.specificity[0]; }
          if (a.specificity[1] !== b.specificity[1]) { return a.specificity[1] - b.specificity[1]; }
          if (a.specificity[2] !== b.specificity[2]) { return a.specificity[2] - b.specificity[2]; }

          return a.specificity[3] - b.specificity[3];
        }
        
        return b.inheritance.length - a.inheritance.length; 
      });
      rules.reverse();
      
      var computedRule = {};
      for(var i = 0; i < rules.length; i++) {
        if (rules[i].properties == null) { continue; }
        
        for (var key in rules[i].properties) {
          if(!rules[i].properties.hasOwnProperty(key)) { continue; }
      
          var prop = rules[i].properties[key],
            property = key + ':' + prop.value,
            media = rules[i].media
            computedRule[media] = computedRule[media] || {overridden: [], effective: []}
          ;
          if (prop.status == 'cancelled') { 
            computedRule[media].overridden.push(property);
          } else {
            computedRule[media].effective.push(property);
          }
        }
      }

      return computedRule;
    }
  }
});

chrome.runtime.sendMessage({
  from: 'content',
  subject: 'finish_loaded'
});
