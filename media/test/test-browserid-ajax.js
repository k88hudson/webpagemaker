"use strict";

defineTests(["thimble/browserid-ajax"], function(BrowserIDAjax) {
  module("thimble/browserid-ajax");
  
  function FakeNavigatorID() {
    return {
      _options: null,
      watch: function(options) {
        this._options = options;
      }
    };
  }
  
  function FakeNetwork(handlers) {
    return {
      ajax: function(options) {
        handlers[options.type + ' ' + options.url](options);
      }
    };
  }
  
  test("verification works", function() {
    var loginEvents = 0;
    var browserid = BrowserIDAjax({
      email: '',
      id: FakeNavigatorID(),
      verifyURL: '/verify',
      logoutURL: '/logout',
      csrfToken: 'fake csrf token',
      network: FakeNetwork({
        'POST /verify': function(options) {
          equal(options.data.assertion, 'fake assertion for foo@bar.org');
          equal(options.headers['X-CSRFToken'], 'fake csrf token');
          equal(options.dataType, 'json');
          options.success({
            csrfToken: 'new fake csrf token',
            email: 'foo@bar.org'
          });
        }
      })
    }).on('login', function() { loginEvents++; });
    
    equal(browserid.id._options.loggedInUser, null);
    equal(browserid.email, null);
    equal(browserid.csrfToken, 'fake csrf token');
    
    browserid.id._options.onlogin('fake assertion for foo@bar.org');
    
    equal(loginEvents, 1);
    equal(browserid.email, 'foo@bar.org');
    equal(browserid.csrfToken, 'new fake csrf token');
  });
  
  test("logout works", function() {
    var logoutEvents = 0;
    var browserid = BrowserIDAjax({
      email: 'foo@barf.org',
      id: FakeNavigatorID(),
      verifyURL: '/verify',
      logoutURL: '/logout',
      csrfToken: 'fake csrf token',
      network: FakeNetwork({
        'POST /logout': function(options) {
          equal(options.headers['X-CSRFToken'], 'fake csrf token');
          equal(options.dataType, 'json');
          options.success({
            csrfToken: 'another new fake csrf token',
            email: null
          });
        }
      })
    }).on('logout', function() { logoutEvents++; });
    
    equal(browserid.id._options.loggedInUser, 'foo@barf.org');
    equal(browserid.email, 'foo@barf.org');
    equal(browserid.csrfToken, 'fake csrf token');
    
    browserid.id._options.onlogout();
    
    equal(logoutEvents, 1);
    equal(browserid.email, null);
    equal(browserid.csrfToken, 'another new fake csrf token');
  });
});
