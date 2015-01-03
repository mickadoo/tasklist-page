$(document).ready(function(){

    // todo remove for production
    $.ajaxSetup({ cache: false });

    reloadAll();

    $('#show-add-task-button').click(function(){
        showInputBox();
    });

    $('body').on('click', '#add-task',function(event){
        event.preventDefault();
        $('#add-task-form').hide();
        createTask();
    });

    $('body').on('click', '.task.row .edit-task-button',function(event){
        $row = $(this).parent('.row');
        replaceRowWithForm($row);
    });

    $('body').on('click', '.task.row .show-milestone-form-button',function(event){
        $row = $(this).parent('.row');
        showNewMilestoneForm($row);
    });

    $('body').on('click', '.task.row #add-milestone-button',function(event){
        event.preventDefault();
        $form = $(this).parent('form');
        createMilestone($form);
    });

    $('body').on('click', '.task.row',function(event){
        if($(document.activeElement).closest('.row')[0] != $(this)[0]){
            getMilestonesForTask($(this));
        }
    });

    // only reload if focus is not on child element in form
    $('#task-container').on('focusout', '#edit-task-form', function(event){
        var $form = $(this);
        setTimeout(function() {
            if (!event.delegateTarget.contains(document.activeElement)) {
                patchTask($form);
                reloadAll();
            }
        });
    });

    $('#task-container').on('click', '.hide-milestones-button', function(event) {
        $row = $(this).parent('.row');
        $row.find('.hide-milestones-button').remove();
        $row.find('.milestones-holder').remove();
    });
});

function reloadAll(){
    $('#task-container').html('');
    $.ajax(
        {
            url:"http://api.tasklist.dev/task/",
            dataType: "json",
            type : 'GET',
            success:function(result){
                if (result.data) {
                    after = null;
                    $.each(result.data, function (index, task) {
                        insertTaskRow(task.id, task.name, task.difficulty, after);
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

function replaceRowWithForm($row){
    if (! $('#edit-task-form').length ) {
        var taskName = $row.find('.task-name').text();
        var taskDifficulty = $row.attr('data-difficulty');
        var taskId = $row.attr('data-id');
        $.get('/elements/edit_task_form.html', function (data) {
            data = data.replace('{{ task.name }}', taskName);
            data = data.replace('{{ task.id }}', taskId );
            $row.html(data);
            $('#edit-task-form #edit-task-difficulty').val(taskDifficulty);
            $('#edit-task-form #edit-task-name').focus();
        });
    }
}

function insertTaskRow(taskId, taskName, taskDifficulty, after){
    var row = '<div id = "task-row-{{ task.id }}" data-id = "{{ task.id }}" data-difficulty="{{ task.difficulty }}" class = "row task {{ task.difficultyClass }}"><span class = "task-name">{{ task.name }}</span><button class = "edit-task-button">edit</button><button class = "show-milestone-form-button">add milestone</button></div>';

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

function showInputBox(){
    if (! $('#add-task-form').length ) {
        $.get('/elements/add_task_form.html', function (data) {
            $('body').append(data);
        });
    }
}

function getDifficultyClass(difficulty){
    switch (difficulty){
        case 1: return 'green';
        case 2: return 'blue';
        case 3: return 'red';
    }
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
                    if (result.data){
                        addMilestonesToRow($row, result.data);
                    } else {
                        alert('no milestones exists for that task');
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log(errorThrown);
                }
            }
        );
    }
}

function showNewMilestoneForm($row){
    if (! $row.has('#add-milestone-form').length ) {
        $.get('/elements/add_milestone_form.html', function (data) {
            data = data.replace('{{ task.id }}', $row.attr('data-id'));
            $row.append(data);
        });
    }
}

function addMilestonesToRow($row, milestones){
    $row.append('<button class = "hide-milestones-button">hide milestones</button>');
    var milestoneHolder = '<div class = "milestones-holder">';
    $.each(milestones, function(index, milestone){

        if (!milestone.reward) { milestone.reward = ''};
        if (!milestone.rewardBudget) { milestone.rewardBudget = ''};

        milestoneHolder += '<div class="milestone row" data-id="' + milestone.id + '"><span class = "milestone-name">' + milestone.name + '</span><span class = "milestone-reward">' + milestone.reward + '</span><span class = "milestone-reward-budget">' + milestone.rewardBudget + '</span></div>';
    });
    $row.append(milestoneHolder)
}

function createTask(){
    var taskName = $('#add-task-form #new-task-name').val();
    var difficulty = $('#add-task-form #new-task-difficulty').find(":selected").text();
    $.ajax(
        {
            url:"http://api.tasklist.dev/task/",
            dataType: "json",
            crossDomain: true,
            processData: false,
            type : 'POST',
            data: '{"name":"' + taskName + '", "difficulty":"' + difficulty + '"}',
            success:function(result){
                reloadAll();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
            }
        }
    );
}

function createMilestone($form){
    var parentId = $form.find('#new-milestone-parent-id').val();
    var milestoneName = $form.find('#new-milestone-name').val();
    var milestoneReward = $form.find('#new-milestone-reward').val();
    var milestoneRewardBudget = $form.find('#new-milestone-reward-budget').val();
    $.ajax(
        {
            url:"http://api.tasklist.dev/task/" + parentId + "/milestone/",
            dataType: "json",
            crossDomain: true,
            processData: false,
            type : 'POST',
            data: '{"name":"' + milestoneName + '", "reward":"' + milestoneReward + '", "rewardBudget":"' + milestoneRewardBudget + '"}',
            //data: '{"name":"' + milestoneName + '", "reward":"' + milestoneReward + '", "milestoneRewardBudget":"' + milestoneRewardBudget + '"}',
            success:function(result){
                console.log(result);
                reloadAll();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
            }
        }
    );
}

function patchTask($form){
    var taskId = $form.find('#edit-task-id').val();
    var taskName = $form.find('#edit-task-name').val();
    var taskDifficulty = $form.find('#edit-task-difficulty').find(":selected").text();

    $.ajax(
        {
            url:"http://api.tasklist.dev/task/" + taskId + "/",
            dataType: "json",
            crossDomain: true,
            processData: false,
            type:"PATCH",
            data: '{"name":"' + taskName + '", "difficulty":"' + taskDifficulty + '"}',
            success:function(result){
                reloadAll();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
            }
        }
    );
}