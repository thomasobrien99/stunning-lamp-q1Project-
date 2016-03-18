var user = new UserSchedule();
var toggleScheduleShift = 2;

/////////////////////////////////////////
function Segment(time)
{
  this.time = time;
  this.status = 'available';
  this.description = 'Free';
  this.location = 'defaultLocation';
  this.toHTML = function()
  {
    var str = '<div class = "two columns">';
    str+= '<div class = "segment" status = "'+this.status;
    str+= '" data-location ="'+this.location;
    str+= '" data-time = "'+this.time+'">';
    str+= this.description+'</div>';
    str+= '</div>';
    return str;
  }.bind(this);
}
/////////////////////////////////////////
function Hour(hr){
  if(hr<10) hr = "0"+hr;
  this.segments = [];
  
  for (var i = 0; i < 4; i++)
  {
    this.segments.push( new Segment(hr + (i === 0 ? "00" : i*15+"")));
  }
  
  this.toHTML = function()
  {
    var str = '<div class = "row">';
    str += '<div class = "three columns">';
    str+= '<div>'+hr+'</div>';
    str+= '</div>';
    this.segments.forEach(function(el){
      str+= el.toHTML();
    });
    str+= '</div>';
    return str;
  }.bind(this);
}
////////////////////////////////////////

////////////////////////////////////////
function getBlocks(){
  var userBlocks = [];
  $(".blocksRow").each(function(idx, el){
    var blockLocation = $(el).find(".location").val();
    if(!blockLocation) blockLocation = "default location";
    var blockDescription = $(el).find(".blockDesc").val();
    if(!blockDescription) blockDescription = "BUSY";
    
    var startPosition = $(el).find(".from").timepicker("getTime");

    var endPosition = $(el).find(".to").timepicker("getTime");

    if(startPosition && endPosition)
    {
      startPosition = startPosition.toLocaleTimeString('en-US', { hour12: false });
      startPosition = startPosition.replace((/[:]/g), '').slice(0,4);
     
      endPosition = endPosition.toLocaleTimeString('en-US', { hour12: false });
      endPosition = endPosition.replace((/[:]/g), '').slice(0,4);

      if(startPosition > endPosition)
      {
        alert(startPosition+ " to " +endPosition + " is not a valid time range!");
      }
      else
      {
        userBlocks.push(
        {
          location: blockLocation,
          description: blockDescription,
          start : startPosition,
          end : endPosition
        });
      }
    } 
  });

  return userBlocks;
}
///////////////////////////////////////

///////////////////////////////////////
function applyBlocks(schedule){
  var blocks = getBlocks();
  blocks.forEach(function(block)
  {
    schedule.forEach(function(hour)
    {
      hour.segments.forEach(function(segment){
        if(segment.time >= block.start && segment.time < block.end)//&& block.end >= segment.time)
        {
          segment.status = "unavail";
          segment.description = block.description;
          segment.location = block.location;
        }
      });
    });
  });
}
/////////////////////////////////////

/////////////////////////////////////
function getActivities(){
  var userActivities = [];
  $(".activitiesRow").each(function(idx, el){
    var activityLocation = $(el).find(".location").val();
    var activityDescription = $(el).find(".description").val();
    
    if(!(activityLocation || activityDescription)) return true;
    if(!activityLocation) activityLocation = "default location";
    if(!activityDescription) activityDescription = "FUN";

    var activityDurationString = $(el).find(".duration").val();
    
    var activityDuration;

    switch (activityDurationString){
      case "One Hour": activityDuration = 1; break;
      case "Two Hours": activityDuration = 2; break;
      case "Three Hours": activityDuration = 3; break;
      case "Four Hours": activityDuration = 4; break;
    }

    userActivities.push(
    { 
      location : activityLocation,
      description: activityDescription,
      duration : activityDuration
    });
  });
  
  return userActivities;
}
///////////////////////////////////////

///////////////////////////////////////

function scheduleActivities(schedule)
{
  var activities = getActivities();

  activities.sort(function(a, b)
  {
    return b.duration-a.duration;
  });

  activities.forEach(function(activity)
  {
    //Determines the required number of segments for the current activity.
    var lengthNeeded = activity.duration * 4;

    var availCounter = 0;
    var startTime = -1;
    var barelyBigEnough = false;

    var locationPreceding;
    var locationFollowing;
    var activityLocation = activity.location;

    //Loop through and find an appropriate starting time for this activity.
    schedule.forEach(function(hour, idx)
    {
      for (var i = 0; i < hour.segments.length; i++)
      {
        
        if(hour.segments[i].status === "available")
        {
          availCounter++;

          if(startTime === -1){
            if(hour.segments[i-1]) locationPreceding = hour.segments[i-1].location;
            startTime = hour.segments[i].time; 
          }

          if(availCounter === lengthNeeded){ barelyBigEnough = true; }
        }
        else
        {
          if(barelyBigEnough === true){ if(hour.segments[i+1]) locationFollowing = hour.segments[i+1].location; break; } //////IF A BIG ENOUGH SPOT WAS FOUND, BREAK OUT OF THE LOOP AFTER CALCULATING THE FREE BLOCK LENGTH
          availCounter = 0;
          startTime = -1;
        }
      }

      if(barelyBigEnough)
      {
        if(lengthNeeded <= availCounter)
        {
          schedule.forEach(function(hour)
            {
              hour.segments.forEach(function(segment)
              {
                if(segment.time >= startTime)
                {
                  if(lengthNeeded > 0)
                  {
                    segment.status = "activity";
                    segment.description = activity.description;
                    segment.location = activity.location;
                  }
                lengthNeeded--;
                }
              });
            });
          }  
        }
      });
    });
}
//////////////////////////////////////////////

//////////////////////////////////////////////
function UserSchedule(){
  this.schedule = [];
  this.update = function()
  {
    this.schedule = [];
    for(var k = 0; k < 24; k++)
    {
      this.schedule.push(new Hour(k));
    }

    $(".schedules").empty();
    applyBlocks(this.schedule);
    if(toggleScheduleShift % 2 === 0){ getLocations(); $(".schedules").hide(); $("#commitButton").val("Schedule!");}
    else{ scheduleActivities(this.schedule);$(".schedules").fadeIn(); $("#commitButton").val("Get Ready!");}
    this.drawSchedules(); 
    addTravelInformation();
    toggleScheduleShift++;

  }.bind(this);

  this.drawSchedules = function(){
    $(".schedules").empty();
    this.schedule.forEach(function(el,idx)
    {
      var str = el.toHTML();
      $(".schedules").append(str);
    });
    $(".schedules").append('<div class row><div class = "twelve columns" id = "travelNotes"><h5>Travel Notes</h5></div></div>');
  }.bind(this);
}

////////////////////////////////////////////////////
function getLocations()
{
  var geoCoder = new google.maps.Geocoder();
  locationsArray = [];
  $(".location").each(function(idx, el){
    if(!el.value){return;}
    geoCoder.geocode({address:el.value, componentRestrictions: {locality: "San Francisco"}}, function(results, status) 
    {
       if (status == google.maps.GeocoderStatus.OK)
       {
        el.value = (results[0].formatted_address);
        if (el.value === "San Francisco, CA, USA")(el.value = "default location");
       }
       else 
       { 
         alert("Geocode was not successful for the following reason: " + status);
       }
  
    });
  });
}

/////////////////////////////////////////////////
function addTravelInformation(){
  var precedingLocation;
  
  $(".segment").each(function(index, el){
    
    if(index === 1)precedingLocation = $(".segment")[index - 1].dataset.location;
    
    if ((precedingLocation&&precedingLocation !== "default location") && (el.dataset.location && el.dataset.location !== "defaultLocation"))
    {
      if (el.dataset.location !== precedingLocation)
      {
        calculateRoute(precedingLocation, el.dataset.location, $(".mode").val().toUpperCase());
        precedingLocation = el.dataset.location;
      }
    }
   });
}

//////////////////////////////////////////////
function calculateRoute(from, to, mode)
{  
  var directionsService = new google.maps.DirectionsService();
  var directionsRequest = 
  {
    origin: from,
    destination: to,
    travelMode: mode,
    transitOptions: {
    departureTime: new Date()
  },
    unitSystem: google.maps.UnitSystem.METRIC
  };
  
  var durationMinutes;

  directionsService.route(
    directionsRequest,
    function(response, status)
    {
      if (status == google.maps.DirectionsStatus.OK)
      {
        new google.maps.DirectionsRenderer(
        {
          directions: response
        });

        durationMinutes = Math.round(response.routes[0].legs[0].duration.value/60);
        var str = "<li>The trip duration between " + from.slice(0,-29);
        str += " and " + to.slice(0,-29) + " is "+durationMinutes;
        str += " minutes by "+ mode+". Consider allocating more time for this activity.</li>";
        console.log(str);

        $(".schedules").append( str );

      }
      else
      {
        console.log("Error");
      }
    }
  );
}

////////////////////////////////////////////

var n = 2;
function addNewTimePickers(){
  if (n > 5) return;
  var str = '';
  str += '<div class = "blocksRow row">';
  str += '<div class = "four columns">';

  str += '<input type="text" data-time-format="H:i" class="timepicker from" placeholder = "From"/>';

  str += '<input type="text" data-time-format="H:i" class="timepicker to" placeholder = "To"/></div>';
  str += '<div class = "four columns"><input type = "text" class = "blockDesc" placeholder = "Work, School, etc."></div>';
  str += '<div class = "four columns">';
  str += '<input type = "text" class = "location" placeholder="Location"></div>';
  str += '</div>';
  n++;
  $(".timepickers").append(str);

  $(".timepicker").timepicker({'step':15});
}

var m = 2;
function addNewActivityFields(){
  if (m > 5) return;

  var str = '';
  str += '<div class = "activitiesRow row">';
  str += '<div class = "four columns">';
  str += '<input type="text" class="description" placeholder = "Activity"/></div>';
  str += '<div class = "four columns">';
  str += '<select class="duration" name="duration" required="required">';
  str += '<option selected>One Hour</option>';
  str += '<option>Two Hours</option>';
  str += '<option>Three Hours</option>';
  str += '<option>Four Hours</option>';
  str += '</select>';
  str += '</div>';
  str += '<div class = "four columns">';
  str += '<input type = "text" class = "location" placeholder="Location">';
  str += '</div>';
  m++;
  $(".activities").append(str);

}

  $(document).ready(function() {

    $("#datepicker").datepicker({inline: true});
    $(".timepicker").timepicker({'step':15});

    $("#blockMore").on("click", addNewTimePickers);

    $("#addActivity").on("click", addNewActivityFields);

    $("#commitButton").on("click", user.update);
});