class PythonClass:

    # There might be comments within the code as well
    def __init__(self, foo, bar, xyz):
        self.foo = foo
        self.bar = bar
        self.xyz = xyz
        self.some_other_property = 123
        self.default_value = 0    # This is a comment

    def some_function(self):
        self.some_other_property = self.default_value
        print('some_other_property was set')

    def do_something(self):
        print(f'The {self.foo} is now doing something')
