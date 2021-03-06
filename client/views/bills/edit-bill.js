Template.editBill.helpers({
    allItems: function(){
      return Items.find();
    }
});

function findItem(val){
  return (Items.findOne({ $or: [
          { 'item' : val },
          { 'description': val }
        ]}));
}

Template.editBill.rendered = function () {
  AutoCompletion.init("input#searchBox");

  Mousetrap.bind(['ctrl+return'], function(e) {
    $("#payment").submit();
  });

  Mousetrap.bind(['ctrl+shift+return'], function(e) {
    $("#savement").submit();
  });
  // function addToCart(obj){
    
  // }
}

Template.editBill.onCreated(function(){
  var arrCart = [];
  var data = arrCart ;
  var id=$("#bill-id").val();
  var dd = Bills.findOne({_id:id}).data;
  arrCart = data.concat(dd);
  console.log(arrCart);
})

Template.editBill.events = {
  'keyup input#searchBox': function () {
    AutoCompletion.autocomplete({
      element: 'input#searchBox',       // DOM identifier for the element
      collection: Items,              // MeteorJS collection object
      field: 'description',                    // Document field name to search for
      limit: 0,                         // Max number of elements to show
      sort: { price: 1 }});              // Sort object to filter results with
      //filter: { 'gender': 'female' }}); // Additional filtering
  },
  'focusout #searchBox': function(e){
    var val = $("#searchBox").val();
    var item = Items.findOne({ $or: [
            { 'item' : val },
            { 'description': val }
          ]});
    if(item){
      $("#searchBox").val(item.item);
      $('#searchItem').val(item.description);
      $('#searchMrp').val(item.price);
      $('#searchTotal').val(item.price);
      
    }
  },
  'change #searchQty': function(e){
    if($("#searchBox").val()){
    var total = parseInt($('#searchMrp').val()) * $('#searchQty').val();
    $('#searchTotal').val(total);
  }
  },
  'change #searchDisc': function(e){

    if($("#searchBox").val()){
    var total = $('#searchTotal').val();
    var disc = $('#searchDisc').val();
    if(disc){var discAmount = total * (disc/100);}
    else {
      discAmount = 0;
    }
    var ftotal = total - discAmount;
    ftotal = ftotal.toFixed(2);
    $("#searchTotal").val(ftotal);
    }
  },
  'submit #addToCart': function(e){
    e.preventDefault();
    var val = $("#searchBox").val();
    var orig = Items.findOne({ $or: [
            { 'item' : val },
            { 'description': val }
          ]});
    var item = {};
    item.code = $("#searchBox").val() || orig.item;      
    item.description = $("#searchItem").val() || orig.description;
    item.qty = $("#searchQty").val() || 1;
    item.mrp = $("#searchMrp").val() || orig.price;
    item.disc = $("#searchDisc").val() || 0;
    item.itemT = item.mrp * item.qty;
    if(item.disc===0){
      item.amount = orig.price * item.qty;
    } else {
      item.amount = $("#searchTotal").val() ;
    }
    arrCart.push(item);
    console.log(arrCart);
    addToTable(item);
    $('#addToCart')[0].reset();
    $("#searchBox").focus();
    $("#searchQty").val(1);
    calcTotal();
  },
  'click .remove': function(e){
    var val = $(e.currentTarget).children('input:hidden').val();
    arrCart = arrCart
                   .filter(function (el) {
                            return el.code !== val;
                           });
    console.log(arrCart);

    $('#displayTable tr[data-code="'+val+'"]').remove();
    calcTotal();
  },
  'click .increment': function(e){
    // Find the object having the hidden code
    // increment it's quantity
  },
  'submit #payment': function(e){
    e.preventDefault();
    var data = arrCart ;
    var id=$("#bill-id").val();
    // var dd = Bills.findOne({_id:id}).data;
    // data = data.concat(dd);
    var customer = $('#party-name').val();
    var a = {};
    a.total = $("#t-total").text();
    a.savings = $("#t-saving").text()
    a.grand = $("#t-calcTotal").text();
    var payed = true;
    // save the array and name, assign a bill number, and date
    Meteor.call('saveEditedBill', id, customer, data, payed, a, function(err,res){
      if(err){
        alert(err);
      } else{
        arrCart = []
        Router.go("/bills/"+res);
      }
    });

    // redirect to bill?? or print the bill and open billing page again?
  },
  'submit #savement': function(e){
    e.preventDefault();
    // get the customers name
    var data = arrCart ;
    var id=$("#bill-id").val();
    // var dd = Bills.findOne({_id:id}).data;
    // data = data.concat(dd);
    var customer = $('#party-name').val();
    var a = {};
    a.total = $("#t-total").text();
    a.savings = $("#t-saving").text()
    a.grand = $("#t-calcTotal").text();
    var payed = false;
    console.log(data);
    // // save the array and name, assign a bill number, and date
    Meteor.call('saveEditedBill', id, customer, data, payed, a, function(err,res){
      if(err){
        alert(err);
      } else{
        arrCart = []
        Router.go("/bills/");
      }
    });
  }
}

function addToTable(obj){
  $('#displayTable tr.sum').before(
    '<tr class="dyn" data-code="'+ obj.code +'" ><td>'+obj.code+'</td>'+
    '<td>'+obj.description+'</td>'+
    '<td class="increment">'+obj.qty+'<input type="hidden" value="'+ obj.code +'" /></td>'+
    '<td>'+obj.mrp+'</td>'+
    '<td>'+obj.disc+'</td>'+
    '<td>'+obj.amount+'</td>'+
    '<td class="remove" > <i class="fa fa-remove" style="color:red;"></i>'+
    '<input type="hidden" value="'+ obj.code +'" /></td></tr>');
}

function calcTotal(){
  var calcTotal = 0;
  var total = 0;
  // console.log(arrCart);
  arrCart.forEach(function(val){
    calcTotal += parseFloat(val.amount);
    total += parseFloat(val.itemT);
  });
  var saving = total - calcTotal;
  saving = saving.toFixed(2);
  $("#t-total").text(total);
  $("#t-saving").text(saving);
  $("#t-calcTotal").text(calcTotal);
}
