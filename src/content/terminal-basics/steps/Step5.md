<script>
import Alert from "$components/Alert.svelte";
import Execute from "$components/Execute.svelte";
</script>

We can store the result of our analyses in files using the `>` operator.

For example, to store all burrito orders into `burritos.tsv`:

<Execute command='grep "Burrito" orders.tsv > burritos.tsv' />

Now notice that <Execute command="ls" inline /> shows the newly-created file!

<Alert color="warning">
	Be careful when filtering files for the `>` character!
</Alert>

Let's take a brief detour from burritos to cover an important command-line gotcha.

If you're using `grep` to extract lines from a file that contain the `>` character, make sure to put it in quotes! Otherwise, `grep` interprets `>` as an operator and will truncate your file and your data will be lost (there is no "Trash" when working on the command line).

Let's illustrate this pitfall in our sandbox. If we `grep` for `>` with quotes, our 3 chromosomes are listed as expected:

<Execute command='grep ">" ref.fa' />

**But**, not quoting results in a truncated file!

<Execute command='grep > ref.fa' />

Using `ls`, verify that `ref.fa` is empty (i.e. `0` in the 5th column):

<Execute command='ls -l' />

Not to worry, we had prepared a backup file `ref.fa.bak` that you can use to regenerate `ref.fa` with the `cp` (**c**o**p**y) command:

<Execute command='cp ref.fa.bak ref.fa' />

This is a common mistake for anyone working on the command line, so it's good to get it out of the way in a safe environment!

And although putting quotes around `>` fixes the problem, a better way to avoid this issue altogether is to always prepend `cat` to your command-line pipelines (`cat` returns the contents of a file):

<Execute command='cat ref.fa | grep ">"' />

With this approach, missing quotes lead to an error message instead of data loss.
