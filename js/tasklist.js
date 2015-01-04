$(document).ready(function(){

    // todo remove for production
    $.ajaxSetup({ cache: false });

    showAllTasks();

    // ### switch tab listeners ###
    $('#show-tasks-tab-button').click(function(){
        showAllTasks();
    });

    $('#show-rewards-tab-button').click(function(){
        showAllDueRewards();
    });

    // ### show create-new form listeners ###

    $('#show-add-task-button').click(function(){
        showCreateNewTaskForm();
    });

    $('#task-container').on('click', '.task.row .show-milestone-form-button',function(){
        var $row = $(this).parent('.row');
        showCreateMilestoneForm($row);
    });

    // ### show edit form listeners ###

    $('#task-container').on('click', '.task.row .edit-task-button',function(){
        var $row = $(this).parent('.row');
        replaceTaskRowWithEditForm($row);
    });

    $('#task-container').on('click', '.milestone.row .edit-milestone-button',function(){
        var $row = $(this).parent('.row');
        replaceMilestoneRowWithEditForm($row);
    });

    // ### delete button listeners ###
    $('#task-container').on('click', '.task.row .delete-task-button',function(){
        var taskId = $(this).parent('.row').attr('data-id');
        deleteTask(taskId);
    });

    // ### delete button listeners ###
    $('#task-container').on('click', '.task.row .delete-milestone-button',function(){
        var milestoneId = $(this).parent('.row').attr('data-id');
        deleteMilestone(milestoneId, false);
    });

    $('#task-container').on('click', '.reward.row .mark-reward-received-button',function(){
        // if reward is marked as received delete it's parent milestone
        var milestoneId = $(this).parent('.row').attr('data-id');
        deleteMilestone(milestoneId, true);
    });

    // ### form submit listeners ###

    $('body').on('click', '#add-task',function(event){
        event.preventDefault();
        var $form = $('#add-task-form');
        createTask($form);
        $('#add-task-form').remove();
    });

    $('body').on('click', '.task.row #add-milestone-button',function(event){
        event.preventDefault();
        var $form = $(this).parent('form');
        createMilestone($form);
    });

    $('#task-container').on('focusout', '#edit-task-form', function(event){
        var $form = $(this);
        setTimeout(function() {
            if (!event.delegateTarget.contains(document.activeElement)) {
                patchTask($form);
                showAllTasks();
            }
        }, 0);
    });

    $('#task-container').on('focusout', '#edit-milestone-form', function(event){
        var $form = $(this);
        setTimeout(function() {
            if (!event.delegateTarget.contains(document.activeElement)) {
                patchMilestone($form);
                showAllTasks();
            }
        }, 0);
    });

    // ### get info listeners ###

    $('body').on('click', '.task.row',function(event){
        if($(document.activeElement).closest('.row')[0] != $(this)[0]){
            getMilestonesForTask($(this));
        }
    });

    // ### hide info listeners ###

    $('#task-container').on('click', '.hide-milestones-button', function() {
        var $row = $(this).parent('.row');
        $row.find('.hide-milestones-button').remove();
        $row.find('.milestones-holder').remove();
    });

    $('#task-container').on('click', '#cancel-add-milestone-button', function(event) {
        event.preventDefault();
        $('#add-milestone-form').remove();
    });
});

// ### create-new form showers ###
function showCreateNewTaskForm(){
    if (! $('#add-task-form').length ) {
        $.get('/elements/add_task_form.html', function (data) {
            $('body').append(data);
        });
    }
}

function showCreateMilestoneForm($row){
    if (! $row.has('#add-milestone-form').length ) {
        $.get('/elements/add_milestone_form.html', function (data) {
            data = data.replace('{{ task.id }}', $row.attr('data-id'));
            $row.append(data);
        });
    }
}

// ### edit form showers ###
function replaceTaskRowWithEditForm($row){
    if (! $('#edit-task-form').length ) {
        var taskName = $row.find('.task-name').text();
        var taskDifficulty = $row.attr('data-difficulty');
        var taskId = $row.attr('data-id');
        $.get('/elements/edit_task_form.html', function (data) {
            data = data.replace('{{ task.name }}', taskName);
            data = data.replace('{{ task.id }}', taskId );
            $row.html(data);
            $('#edit-task-difficulty').val(taskDifficulty);
            $('#edit-task-name').focus();
        });
    }
}

function replaceMilestoneRowWithEditForm($row){
    if (! $('#edit-milestone-form').length ) {
        var milestoneId = $row.attr('data-id');
        var milestoneName = $row.find('.milestone-name').text();
        var reward = $row.find('.milestone-reward').text();
        var rewardBudget = $row.find('.milestone-reward-budget').text();

        $.get('/elements/edit_milestone_form.html', function (data) {
            data = data.replace('{{ milestone.id }}', milestoneId );
            data = data.replace('{{ milestone.name }}', milestoneName);
            data = data.replace('{{ milestone.reward }}', reward);
            data = data.replace('{{ milestone.rewardBudget }}', rewardBudget);
            $row.html(data);
            $('#edit-milestone-name').focus();
        });
    }
}

// ### info showers ###
function addTaskRow(taskId, taskName, taskDifficulty, after){
    var row = '<div id = "task-row-{{ task.id }}" data-id = "{{ task.id }}" data-difficulty="{{ task.difficulty }}" class = "row task {{ task.difficultyClass }}"><span class = "task-name">{{ task.name }}</span><button class = "edit-task-button">edit</button><button class = "show-milestone-form-button">add milestone</button><button class = "delete-task-button">delete</button></div>';

    row = row.replace('{{ task.id }}', taskId);
    row = row.replace('{{ task.id }}', taskId);
    row = row.replace('{{ task.name }}', taskName);
    row = row.replace('{{ task.difficulty }}', taskDifficulty);
    row = row.replace('{{ task.difficultyClass }}', getDifficultyClass(taskDifficulty));
    if (after !==  null) {
        $('#' + after).after(row);
    } else {
        $('#task-container').append(row);
    }
}

function addMilestonesToRow($row, milestones){
    $row.append('<button class = "hide-milestones-button">hide milestones</button>');
    var milestoneHolder = '<div class = "milestones-holder">';
    $.each(milestones, function(index, milestone){

        if (milestone.complete != 'true') {
            if (!milestone.reward) {
                milestone.reward = ''
            }
            if (!milestone.rewardBudget) {
                milestone.rewardBudget = ''
            }
            milestoneHolder += '<div class="milestone row" data-id="' + milestone.id + '"><span class = "milestone-name">' + milestone.name + '</span><span class = "milestone-reward">' + milestone.reward + '</span><span class = "milestone-reward-budget">' + milestone.rewardBudget + '</span><button class = "edit-milestone-button">edit</button><button class = "delete-milestone-button">delete</button></div>';
        }
    });
    $row.append(milestoneHolder)
}

// ###### AJAX requests #######

// ### get ###
function showAllTasks(){
    $('#task-container').html('');
    $.ajax(
        {
            url:"http://api.tasklist.dev/task/",
            dataType: "json",
            type : 'GET',
            success:function(result){
                if (result.data) {
                    var after = null;
                    $.each(result.data, function (index, task) {
                        addTaskRow(task.id, task.name, task.difficulty, after);
                        after = 'task-row-' + task.id;
                    });
                } else {
                    $('#task-container').html('No tasks');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
            }
        }
    );
}

function getMilestonesForTask($row){
    if (!$row.has('.milestones-holder').length){
        var taskId = $row.attr('data-id');
        $.ajax(
            {
                url:"http://api.tasklist.dev/task/" + taskId + "/milestone/",
                dataType: "json",
                type : 'GET',
                success:function(result){
                    if (result.data && !allMilestonesComplete(result.data)){
                        addMilestonesToRow($row, result.data);
                    } else {
                        alert('no active milestone exists for that task');
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log(errorThrown);
                }
            }
        );
    }
}

function showAllDueRewards(){
    $('#task-container').html('');
    $.ajax(
        {
            url:"http://api.tasklist.dev/reward/get-complete/",
            dataType: "json",
            type : 'GET',
            success:function(result){
                if (result.data) {
                    var rewards = result.data;
                    $.each(rewards, function(index, reward){
                        var row = '<div id = "reward-row-{{ reward.milestoneId }}" data-id = "{{ reward.milestoneId }}" class = "row reward"><span class = "reward-name">{{ reward.name }}</span><span class = "reward-budget">{{ reward.budget }}</span><button class = "mark-reward-received-button">got it!</button></div>';
                        row = row.replace('{{ reward.milestoneId }}', reward.milestoneId);
                        row = row.replace('{{ reward.milestoneId }}', reward.milestoneId);
                        row = row.replace('{{ reward.name }}', reward.name);
                        row = row.replace('{{ reward.budget }}', reward.budget);
                        $('#task-container').append(row);
                    });
                } else {
                    $('#task-container').html('No rewards available');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
            }
        }
    );
}

// ### post ###
function createTask($form){

    var task = {};

    task.name = $form.find('#new-task-name').val();
    task.difficulty = $form.find('#new-task-difficulty').find(":selected").text();

    $.ajax(
        {
            url:"http://api.tasklist.dev/task/",
            dataType: "json",
            crossDomain: true,
            processData: false,
            type : 'POST',
            data: JSON.stringify(task),
            success:function(){
                showAllTasks();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
            }
        }
    );
}

function createMilestone($form){
    var parentId = $form.find('#new-milestone-parent-id').val();

    var milestone = {};

    milestone.name = $form.find('#new-milestone-name').val();
    milestone.reward = $form.find('#new-milestone-reward').val();
    milestone.rewardBudget = $form.find('#new-milestone-reward-budget').val();

    $.ajax(
        {
            url:"http://api.tasklist.dev/task/" + parentId + "/milestone/",
            dataType: "json",
            crossDomain: true,
            processData: false,
            type : 'POST',
            data: JSON.stringify(milestone),
            //data: '{"name":"' + milestoneName + '", "reward":"' + milestoneReward + '", "milestoneRewardBudget":"' + milestoneRewardBudget + '"}',
            success:function(result){
                showAllTasks();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
            }
        }
    );
}
// ### put ###

// ### patch ###
function patchTask($form){
    var taskId = $form.find('#edit-task-id').val();

    var task = {};
    task.name = $form.find('#edit-task-name').val();
    task.difficulty = $form.find('#edit-task-difficulty').find(":selected").text();

    $.ajax(
        {
            url:"http://api.tasklist.dev/task/" + taskId + "/",
            dataType: "json",
            crossDomain: true,
            processData: false,
            type:"PATCH",
            data: JSON.stringify(task),
            success:function(){
                showAllTasks();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
            }
        }
    );
}

function patchMilestone($form){

    var milestoneId = $form.find('#edit-milestone-id').val();

    var updatedMilestone = {};
    updatedMilestone.name = $form.find('#edit-milestone-name').val();
    updatedMilestone.reward = $form.find('#edit-milestone-reward').val();
    updatedMilestone.rewardBudget = $form.find('#edit-milestone-reward-budget').val();

    if ($form.find('#edit-milestone-complete').prop('checked')){
        updatedMilestone.complete = 'true';
    }

    $.ajax(
        {
            url:"http://api.tasklist.dev/milestone/" + milestoneId + "/",
            dataType: "json",
            crossDomain: true,
            processData: false,
            type:"PATCH",
            data: JSON.stringify(updatedMilestone),
            success:function(){
                showAllTasks();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
            }
        }
    );
}

// ### delete ###
function deleteTask(taskId){
    var confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (confirmDelete) {
        $.ajax(
            {
                url: "http://api.tasklist.dev/task/" + taskId + "/",
                dataType: "json",
                type: 'DELETE',
                success: function (result) {
                    console.log(result);
                    if (result.data) {
                        showAllTasks();
                    } else {
                        alert('delete not successful');
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log(errorThrown);
                }
            }
        );
    }
}

function deleteMilestone(milestoneId, silent){
    if (!silent){
        var confirmDelete = window.confirm("Are you sure you want to delete this milestone?");
    } else {
        confirmDelete = true;
    }

    if (confirmDelete) {
        $.ajax(
            {
                url: "http://api.tasklist.dev/milestone/" + milestoneId + "/",
                dataType: "json",
                type: 'DELETE',
                success: function (result) {
                    console.log(result);
                    if (result.data) {
                        showAllTasks();
                    } else {
                        alert('delete not successful');
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log(errorThrown);
                }
            }
        );
    }
}

// ### other helpers ###
function getDifficultyClass(difficulty){
    switch (difficulty){
        case 1: return 'green';
        case 2: return 'light-blue';
        case 3: return 'blue';
        case 4: return 'orange';
        case 5: return 'red';
    }
}

function allMilestonesComplete(milestones){
    var allComplete = true;
    $.each(milestones, function(index, milestone){
        if (milestone.complete == 'false'){
            allComplete = false;
            return allComplete;
        }
    });
    return allComplete;
}